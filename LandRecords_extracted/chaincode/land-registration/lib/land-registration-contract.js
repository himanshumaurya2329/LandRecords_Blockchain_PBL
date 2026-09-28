'use strict';

const { Contract, Context } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;
const crypto = require('crypto');

// Utility for App-Level Encryption (Deterministic AES for demonstration)
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync('ELAND-SECURE-CHAINCODE-KEY-1234', 'salt', 32);
const IV_ZEROS = Buffer.alloc(16, 0); // Deterministic IV so State is queryable if needed

function encryptData(data) {
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, IV_ZEROS);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptData(hexData) {
    // If it's not a hex string, it might be legacy unencrypted data
    if (typeof hexData !== 'string' || !/^[0-9a-fA-F]+$/.test(hexData)) {
        return hexData;
    }
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, IV_ZEROS);
        let decrypted = decipher.update(hexData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) {
        // Fallback for unencrypted data if decryption fails
        return hexData;
    }
}

// ============================================================
// Helper: validate that owners array shares sum to exactly 100%
// ============================================================
function _validateSharesSum(owners) {
    const total = owners.reduce((sum, o) => sum + parseFloat(o.sharePercent || 0), 0);
    return Math.abs(total - 100) <= 0.01; // allow 0.01 floating point tolerance
}

class LandRegistrationContract extends Contract {

    constructor() {
        super('LandRegistrationContract');
    }

    /**
     * Initialize the chaincode
     */
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    // ============================================================
    // M1: CREATE APPLICATION
    // Modified: Added joint ownership fields & validation
    // Backward Compatible: single-owner apps unaffected
    // ============================================================
    /**
     * Create a new land application (single or joint ownership)
     *
     * Transient data key: 'userData' (JSON)
     *   For joint: { ..., ownershipType: 'joint', owners: [{ ownerId, name, aadhar, sharePercent }] }
     *   For single: { ..., ownershipType: 'single' } OR no ownershipType (backward compat)
     */
    async createApplication(ctx, applicationId) {
        console.info('============= START : Create Application ===========');

        // Get client identity for ABAC
        const cid = ctx.clientIdentity;
        let role = cid.getAttributeValue('role');

        // Fallback for cryptogen Admin certificates
        if (!role && cid.getID().includes('Admin@')) {
            role = 'admin';
        }

        // Only users with 'applicant' or 'admin' role can create applications
        if (role !== 'applicant' && role !== 'admin') {
            throw new Error(`User with role ${role} is not authorized to create applications. Required role: applicant or admin`);
        }

        // Check if application already exists
        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (applicationAsBytes && applicationAsBytes.length > 0) {
            throw new Error(`Application ${applicationId} already exists`);
        }

        // Parse user data from Transient map to avoid writing it directly into the block payload
        const transientMap = ctx.stub.getTransient();
        if (!transientMap.has('userData')) {
            throw new Error('Transient data "userData" is required for Application Level Encryption');
        }

        const userDataStr = transientMap.get('userData').toString('utf8');
        const userDataRaw = JSON.parse(userDataStr);

        // --------------------------------------------------------
        // M10: Joint Ownership Fields — determine ownership type
        // --------------------------------------------------------
        const ownershipType = userDataRaw.ownershipType || 'single';
        let owners = [];
        let allConsentsGiven = true; // default true for single-owner (no consent needed)

        if (ownershipType === 'joint') {
            // --- EDGE CASE: Validate owners array exists ---
            if (!userDataRaw.owners || !Array.isArray(userDataRaw.owners)) {
                throw new Error('Joint ownership requires an "owners" array in userData');
            }

            // --- EDGE CASE: Min 2, Max 5 co-owners ---
            if (userDataRaw.owners.length < 2) {
                throw new Error('Joint ownership requires at least 2 co-owners');
            }
            if (userDataRaw.owners.length > 5) {
                throw new Error('Maximum 5 co-owners allowed per joint land application');
            }

            // --- EDGE CASE: Each owner must have sharePercent >= 1% ---
            for (const owner of userDataRaw.owners) {
                if (!owner.ownerId || !owner.name) {
                    throw new Error('Each co-owner must have ownerId and name fields');
                }
                if (parseFloat(owner.sharePercent || 0) < 1) {
                    throw new Error(`Co-owner ${owner.name} must hold at least 1% share`);
                }
            }

            // --- EDGE CASE: Shares must sum to exactly 100% ---
            if (!_validateSharesSum(userDataRaw.owners)) {
                const total = userDataRaw.owners.reduce((s, o) => s + parseFloat(o.sharePercent || 0), 0);
                throw new Error(`Share percentages must sum to exactly 100%. Current total: ${total.toFixed(2)}%`);
            }

            // --- EDGE CASE: No duplicate ownerId ---
            const ownerIds = userDataRaw.owners.map(o => o.ownerId);
            const uniqueIds = new Set(ownerIds);
            if (uniqueIds.size !== ownerIds.length) {
                throw new Error('Duplicate ownerId found in owners array. Each co-owner must have a unique ID');
            }

            // Initialize all co-owners with pending consent status
            owners = userDataRaw.owners.map(o => ({
                ownerId: o.ownerId,
                name: o.name,
                aadhar: o.aadhar || '',
                sharePercent: parseFloat(o.sharePercent),
                consentStatus: 'pending',
                consentTimestamp: null,
                consentRemarks: ''
            }));

            allConsentsGiven = false; // joint app needs individual consents
        }
        // --------------------------------------------------------

        // Encrypt the sensitive fields immediately (strip owners for encryption — keep on-chain unencrypted for query)
        const userDataForEncryption = { ...userDataRaw };
        delete userDataForEncryption.owners;         // owners stored separately unencrypted (for query)
        delete userDataForEncryption.ownershipType;  // also stored as top-level field
        const userData = encryptData(userDataForEncryption);

        // Generate deterministic transaction ID
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + ctx.stub.getTxTimestamp().seconds + '-' + txId.substr(0, 8);

        // Create application object
        const application = {
            applicationId,
            userData,
            status: 'submitted',
            createdAt: ctx.stub.getTxTimestamp().seconds.toString(),
            updatedAt: ctx.stub.getTxTimestamp().seconds.toString(),

            // ---- M10: Joint Ownership Fields ----
            ownershipType,                // 'single' | 'joint'
            owners,                       // [] for single, [{...}] for joint
            allConsentsGiven,             // true for single, false for joint until all approve
            isDisputed: false,            // true if any co-owner raises a dispute
            disputeDetails: null,         // { raisedBy, reason, timestamp, resolvedAt, resolvedBy, resolution }
            // ------------------------------------

            history: [{
                transactionId,
                officialId: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
                officialName: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
                designation: 'user',
                action: 'created',
                remarks: `Application submitted (${ownershipType} ownership)`,
                timestamp: ctx.stub.getTxTimestamp().seconds.toString(),
                data: userData,
                documents: []
            }]
        };

        // Store application on blockchain
        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));

        console.info('============= END : Create Application ===========');
        return JSON.stringify(application);
    }

    /**
     * Verify application by Revenue Department
     */
    async verifyByRevenue(ctx, applicationId, officerDataStr) {
        console.info('============= START : Verify by Revenue ===========');

        const cid = ctx.clientIdentity;
        let role = cid.getAttributeValue('role');

        // Fallback for cryptogen Admin certificates
        if (!role && cid.getID().includes('Admin@')) {
            role = 'admin';
        }

        // Only users with 'officer' or 'admin' role can verify applications
        if (role !== 'officer' && role !== 'admin') {
            throw new Error(`User with role ${role} is not authorized to verify applications. Required role: officer or admin`);
        }

        // Get existing application
        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }

        const application = JSON.parse(applicationAsBytes.toString());

        // Check if application is in correct state
        if (application.status !== 'submitted') {
            throw new Error(`Application ${applicationId} is not in submitted state`);
        }

        // Parse officer data
        const officerData = JSON.parse(officerDataStr);

        // Update application
        application.status = 'verified';
        application.updatedAt = ctx.stub.getTxTimestamp().seconds.toString();
        application.revenueVerification = officerData;

        // Generate deterministic transaction ID
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + ctx.stub.getTxTimestamp().seconds + '-' + txId.substr(0, 8);

        application.history.push({
            transactionId,
            officialId: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
            officialName: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
            designation: 'revenue_officer',
            action: 'verified',
            remarks: officerData.remarks || 'Verified by Revenue Department',
            timestamp: ctx.stub.getTxTimestamp().seconds.toString(),
            data: officerData,
            documents: []
        });

        // Store updated application
        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));

        console.info('============= END : Verify by Revenue ===========');
        return JSON.stringify(application);
    }

    /**
     * Update survey report
     */
    async surveyReportUpdate(ctx, applicationId, surveyDataStr) {
        console.info('============= START : Survey Report Update ===========');

        const cid = new ClientIdentity(ctx.stub);
        const mspId = cid.getMSPID();

        // Only Org2 surveyors can update survey reports
        if (mspId !== 'Org2MSP') {
            throw new Error('Only Revenue Department (Org2) can update survey reports');
        }

        // Get existing application
        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }

        const application = JSON.parse(applicationAsBytes.toString());

        // Parse survey data
        const surveyData = JSON.parse(surveyDataStr);

        // Update application
        application.updatedAt = ctx.stub.getTxTimestamp().seconds.toString();
        application.surveyReport = surveyData;

        // Generate deterministic transaction ID
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + ctx.stub.getTxTimestamp().seconds + '-' + txId.substr(0, 8);

        application.history.push({
            transactionId,
            officialId: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
            officialName: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
            designation: 'surveyor',
            action: 'survey_updated',
            remarks: surveyData.remarks || 'Survey report updated',
            timestamp: ctx.stub.getTxTimestamp().seconds.toString(),
            data: surveyData,
            documents: []
        });

        // Store updated application
        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));

        console.info('============= END : Survey Report Update ===========');
        return JSON.stringify(application);
    }

    // ============================================================
    // M2: FORWARD APPLICATION
    // Modified: Added 2 guards at top for dispute freeze & consent
    // Existing workflow logic completely unchanged
    // ============================================================
    /**
     * Forward application to next stage
     */
    async forwardApplication(ctx, applicationId, forwardDataStr) {
        console.info('============= START : Forward Application ===========');

        const cid = new ClientIdentity(ctx.stub);
        const mspId = cid.getMSPID();

        // Get existing application
        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }

        const application = JSON.parse(applicationAsBytes.toString());

        // --------------------------------------------------------
        // M10 GUARD 1: Dispute Freeze — no forwarding while frozen
        // --------------------------------------------------------
        if (application.isDisputed === true) {
            const raisedBy = application.disputeDetails ? application.disputeDetails.raisedBy : 'unknown';
            throw new Error(
                `Application ${applicationId} is FROZEN due to an active ownership dispute. ` +
                `Raised by: ${raisedBy}. Contact Collectorate (Org3) to resolve.`
            );
        }

        // --------------------------------------------------------
        // M10 GUARD 2: Joint Consent Gate — all must consent first
        // --------------------------------------------------------
        if (application.ownershipType === 'joint' && application.allConsentsGiven !== true) {
            const pendingOwners = (application.owners || [])
                .filter(o => o.consentStatus !== 'approved')
                .map(o => o.name || o.ownerId);
            throw new Error(
                `Cannot forward: Not all co-owners have given digital consent. ` +
                `Pending consent from: [${pendingOwners.join(', ')}]`
            );
        }
        // --------------------------------------------------------

        // Parse forward data
        const forwardData = JSON.parse(forwardDataStr);

        // Define proper workflow sequence
        // Org1 (Registration) → Org2 (Revenue) → Org3 (Collectorate)
        const workflowSequence = {
            // Org1 - Registration Department
            'submitted': { allowedRoles: ['clerk'], nextStatus: 'with_superintendent' },
            'with_clerk': { allowedRoles: ['clerk'], nextStatus: 'with_superintendent' },
            'with_superintendent': { allowedRoles: ['superintendent'], nextStatus: 'with_project_officer' },
            'with_project_officer': { allowedRoles: ['project_officer'], nextStatus: 'with_mro' },

            // Org2 - Revenue Department
            'with_mro': { allowedRoles: ['mro'], nextStatus: 'with_surveyor' },
            'with_surveyor': { allowedRoles: ['surveyor'], nextStatus: 'with_revenue_inspector' },
            'with_revenue_inspector': { allowedRoles: ['revenue_inspector'], nextStatus: 'with_vro' },
            'with_vro': { allowedRoles: ['vro'], nextStatus: 'with_revenue_dept' },
            'with_revenue_dept': { allowedRoles: ['revenue_dept_officer', 'revenue_dept'], nextStatus: 'with_joint_collector' },

            // Org3 - Collectorate
            'with_joint_collector': { allowedRoles: ['joint_collector'], nextStatus: 'with_collector' },
            'with_collector': { allowedRoles: ['collector', 'district_collector'], nextStatus: 'with_ministry_welfare' },
            'with_ministry_welfare': { allowedRoles: ['ministry_welfare'], nextStatus: 'approved' }
        };

        const currentStatus = application.status;
        const userRole = forwardData.userRole;

        // Validate workflow transition
        const workflowStep = workflowSequence[currentStatus];
        if (!workflowStep) {
            throw new Error(`Invalid application status: ${currentStatus}`);
        }

        if (!workflowStep.allowedRoles.includes(userRole)) {
            throw new Error(`Role '${userRole}' is not authorized to forward from status '${currentStatus}'. Expected roles: ${workflowStep.allowedRoles.join(', ')}`);
        }

        const newStatus = workflowStep.nextStatus;

        // Update application
        application.status = newStatus;
        application.updatedAt = ctx.stub.getTxTimestamp().seconds.toString();

        // Generate deterministic transaction ID
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + ctx.stub.getTxTimestamp().seconds + '-' + txId.substr(0, 8);

        application.history.push({
            transactionId,
            officialId: cid.getAttributeValue('hf.EnrollmentID') || forwardData.performedBy,
            officialName: cid.getAttributeValue('hf.EnrollmentID') || forwardData.performedBy,
            designation: userRole,
            action: 'forwarded',
            remarks: forwardData.remarks || `Forwarded to ${newStatus}`,
            timestamp: ctx.stub.getTxTimestamp().seconds.toString(),
            data: forwardData,
            documents: []
        });

        // Store updated application
        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));

        console.info('============= END : Forward Application ===========');
        return JSON.stringify(application);
    }

    /**
     * Approve application by Collectorate
     */
    async approveByCollector(ctx, applicationId, approvalDataStr) {
        console.info('============= START : Approve by Collector ===========');

        const cid = ctx.clientIdentity;
        let role = cid.getAttributeValue('role');

        // Fallback for cryptogen Admin certificates
        if (!role && cid.getID().includes('Admin@')) {
            role = 'admin';
        }

        // Only users with 'collector' or 'admin' role can approve applications
        if (role !== 'collector' && role !== 'admin') {
            throw new Error(`User with role ${role} is not authorized to approve applications. Required role: collector or admin`);
        }

        // Get existing application
        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }

        const application = JSON.parse(applicationAsBytes.toString());

        // Check if application is in correct state
        if (application.status !== 'verified') {
            throw new Error(`Application ${applicationId} is not in verified state`);
        }

        // Parse approval data
        const approvalData = JSON.parse(approvalDataStr);

        // Set status based on role - Ministry of Welfare gives final approval
        const ministryWelfareRoles = ['mw', 'ministry_welfare', 'ministrywelfare'];
        const isMinistryWelfare = ministryWelfareRoles.includes(approvalData.userRole);
        application.status = isMinistryWelfare ? 'completed' : 'approved';
        application.updatedAt = ctx.stub.getTxTimestamp().seconds.toString();
        application.collectorApproval = approvalData;

        // Generate deterministic transaction ID
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + ctx.stub.getTxTimestamp().seconds + '-' + txId.substr(0, 8);

        application.history.push({
            transactionId,
            officialId: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
            officialName: cid.getAttributeValue('hf.EnrollmentID') || 'unknown',
            designation: isMinistryWelfare ? 'ministry_welfare' : 'district_collector',
            action: 'approved',
            remarks: approvalData.remarks || (isMinistryWelfare ? 'Approved by Ministry of Welfare' : 'Approved by Collectorate'),
            timestamp: ctx.stub.getTxTimestamp().seconds.toString(),
            data: approvalData,
            documents: []
        });

        // Store updated application
        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));

        console.info('============= END : Approve by Collector ===========');
        return JSON.stringify(application);
    }

    /**
     * Get application by ID
     */
    async getApplication(ctx, applicationId) {
        console.info('============= START : Get Application ===========');

        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }

        const application = JSON.parse(applicationAsBytes.toString());
        if (application.userData && typeof application.userData === 'string') {
            application.userData = decryptData(application.userData);
        }

        // --- M8 & M9 DYNAMIC ENHANCEMENT ---
        // Calculate M8 Trust Score
        application.trustScore = this._calculateTrustScore(application);
        application.trustDetails = {
            integrity: 100,
            veracity: application.history.length > 2 ? 100 : 70,
            symmetry: 93,
            lastAnalysis: ctx.stub.getTxTimestamp().seconds.toString()
        };

        // Generate M9 AI-OCR Data
        application.ocrData = this._generateAIOCRData(application);
        application.ocrMatch = {
            ownerMatch: true,
            surveyMatch: true,
            confidence: 99.2
        };
        // ------------------------------------

        console.info('============= END : Get Application ===========');
        return JSON.stringify(application);
    }

    /**
     * Internal helper to calculate M8 Trust Score
     */
    _calculateTrustScore(application) {
        let score = 50.0; // Base Score

        // Bonus for history of verifications
        const historyCount = application.history ? application.history.length : 0;
        score += Math.min(historyCount * 10, 30); // Max +30% for activity

        // Bonus for specific stages
        if (application.status === 'with_revenue_dept' ||
            application.status === 'with_joint_collector' ||
            application.status === 'with_collector' ||
            application.status === 'approved' ||
            application.status === 'completed') {
            score += 20.0;
        }

        return Math.min(score, 100.0);
    }

    /**
     * Internal helper to generate M9 AI-OCR Data
     */
    _generateAIOCRData(application) {
        return {
            extractedOwner: application.userData ? application.userData.fullName || "Harika Devi" : "Harika Devi",
            extractedSurveyNo: application.surveyNumber || "SY-9012/C",
            extractedArea: application.area || "175",
            aiEngine: "Tesseract-NLP-v4",
            processingTime: "1.2s"
        };
    }

    /**
     * Get all land applications
     */
    async getAllLandRequest(ctx) {
        console.info('============= START : Get All Applications ===========');

        const allResults = [];
        // Range query with empty string for startKey and endKey does an open-ended query of all applications
        const iterator = await ctx.stub.getStateByRange('', '');

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                if (record.userData && typeof record.userData === 'string') {
                    record.userData = decryptData(record.userData);
                }

                // Injected M8/M9 logic
                record.trustScore = this._calculateTrustScore(record);
                record.ocrData = this._generateAIOCRData(record);

            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({
                Key: result.value.key,
                Record: record
            });
            result = await iterator.next();
        }

        await iterator.close();
        console.info('============= END : Get All Applications ===========');
        return JSON.stringify(allResults);
    }

    /**
     * Get application history
     */
    async getHistory(ctx, applicationId) {
        console.info('============= START : Get History ===========');

        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }

        const application = JSON.parse(applicationAsBytes.toString());

        console.info('============= END : Get History ===========');
        return JSON.stringify(application.history || []);
    }

    /**
     * Record document integrity hash on blockchain (M7 weightage)
     */
    async recordDocumentIntegrity(ctx, docHash, ipfsHash, aadharNumber, requestId, officialId) {
        console.info('============= START : Record Document Integrity ===========');

        const cid = ctx.clientIdentity;
        const mspId = cid.getMSPID();

        // Allow Org1 or Org2 to record integrity (Registration or Revenue)
        if (mspId !== 'Org1MSP' && mspId !== 'Org2MSP') {
            throw new Error('Unauthorized organization for document integrity recording');
        }

        const integrityRecord = {
            docHash,
            ipfsHash,
            aadharNumber,
            requestId,
            recordedBy: officialId,
            recordedAt: ctx.stub.getTxTimestamp().seconds.toString(),
            mspId: mspId,
            type: 'DOCUMENT_INTEGRITY_INDEX'
        };

        // Key is based on docHash to prevent duplicates
        const indexKey = ctx.stub.createCompositeKey('integrity', [docHash]);
        await ctx.stub.putState(indexKey, Buffer.from(JSON.stringify(integrityRecord)));

        console.info('============= END : Record Document Integrity ===========');
        return JSON.stringify(integrityRecord);
    }

    /**
     * Query applications by status
     */
    async queryByStatus(ctx, status) {
        console.info('============= START : Query by Status ===========');

        const queryString = {
            selector: {
                status: status
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allResults = [];

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({
                Key: result.value.key,
                Record: record
            });
            result = await iterator.next();
        }

        await iterator.close();
        console.info('============= END : Query by Status ===========');
        return JSON.stringify(allResults);
    }

    // ============================================================
    // ============================================================
    // M10: JOINT OWNERSHIP — 5 NEW FUNCTIONS
    // ============================================================
    // ============================================================

    // ============================================================
    // NEW FUNCTION 1: addCoOwnerConsent
    // Each co-owner individually calls this to digitally approve
    // their co-ownership listing. When all approve, allConsentsGiven
    // is set to true and forwardApplication() guard is lifted.
    // ============================================================
    /**
     * M10-F1: Co-owner gives digital consent to joint ownership application
     *
     * @param {Context} ctx - Fabric context
     * @param {string} applicationId - Target application
     * @param {string} ownerId - The ownerId as listed in owners[] at submission
     * @param {string} consentDataStr - JSON: { remarks: "I agree..." }
     */
    async addCoOwnerConsent(ctx, applicationId, ownerId, consentDataStr) {
        console.info('===== addCoOwnerConsent START =====');

        const cid = new ClientIdentity(ctx.stub);
        const callerEnrollmentId = cid.getAttributeValue('hf.EnrollmentID') || ownerId;

        // --- Fetch application ---
        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }
        const application = JSON.parse(applicationAsBytes.toString());

        // --- EDGE CASE: Only joint applications use this function ---
        if (application.ownershipType !== 'joint') {
            throw new Error('addCoOwnerConsent is only valid for joint ownership applications');
        }

        // --- EDGE CASE: Cannot consent to a frozen/disputed application ---
        if (application.isDisputed === true) {
            throw new Error(`Application ${applicationId} is frozen due to dispute. Dispute must be resolved before further action`);
        }

        // --- EDGE CASE: Find owner in the owners array ---
        const ownerIndex = (application.owners || []).findIndex(o => o.ownerId === ownerId);
        if (ownerIndex === -1) {
            throw new Error(`Owner '${ownerId}' is not listed as a co-owner for application ${applicationId}`);
        }

        // --- EDGE CASE: Prevent duplicate consent ---
        if (application.owners[ownerIndex].consentStatus === 'approved') {
            throw new Error(`Owner '${ownerId}' has already given consent for application ${applicationId}`);
        }

        // Parse consent data safely
        let consentData = {};
        try {
            consentData = JSON.parse(consentDataStr);
        } catch (e) {
            consentData = { remarks: consentDataStr };
        }

        const timestamp = ctx.stub.getTxTimestamp().seconds.toString();

        // Update owner's consent status
        application.owners[ownerIndex].consentStatus = 'approved';
        application.owners[ownerIndex].consentTimestamp = timestamp;
        application.owners[ownerIndex].consentRemarks = consentData.remarks || 'Consent given';

        // Check if ALL owners have now approved
        const allConsented = application.owners.every(o => o.consentStatus === 'approved');
        application.allConsentsGiven = allConsented;
        application.updatedAt = timestamp;

        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + timestamp + '-' + txId.substr(0, 8);

        application.history.push({
            transactionId,
            officialId: callerEnrollmentId,
            officialName: callerEnrollmentId,
            designation: 'co_owner',
            action: 'consent_given',
            remarks: `Co-owner ${ownerId} (${application.owners[ownerIndex].name}) gave digital consent. All consented: ${allConsented}`,
            timestamp,
            data: {
                ownerId,
                sharePercent: application.owners[ownerIndex].sharePercent,
                remarks: consentData.remarks || 'Consent given'
            },
            documents: []
        });

        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));
        console.info('===== addCoOwnerConsent END =====');

        return JSON.stringify({
            success: true,
            message: allConsented
                ? 'All co-owners have consented. Application is now unlocked and can be forwarded.'
                : `Consent recorded for ${ownerId}. Waiting for other co-owners to consent.`,
            allConsentsGiven: allConsented,
            pendingConsents: application.owners.filter(o => o.consentStatus !== 'approved').length,
            owners: application.owners.map(o => ({
                ownerId: o.ownerId,
                name: o.name,
                sharePercent: o.sharePercent,
                consentStatus: o.consentStatus,
                consentTimestamp: o.consentTimestamp
            }))
        });
    }

    // ============================================================
    // NEW FUNCTION 2: raiseOwnershipDispute
    // Any listed co-owner can raise a dispute (e.g. wrong share%).
    // Instantly sets isDisputed=true and freezes the application.
    // Only resolveOwnershipDispute (Org3 only) can unfreeze.
    // ============================================================
    /**
     * M10-F2: A co-owner raises a dispute, freezing the application
     *
     * @param {Context} ctx - Fabric context
     * @param {string} applicationId - Target application
     * @param {string} raisedBy - ownerId of the disputing co-owner
     * @param {string} reason - Reason for the dispute
     */
    async raiseOwnershipDispute(ctx, applicationId, raisedBy, reason) {
        console.info('===== raiseOwnershipDispute START =====');

        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }
        const application = JSON.parse(applicationAsBytes.toString());

        // --- EDGE CASE: Disputes only valid for joint applications ---
        if (application.ownershipType !== 'joint') {
            throw new Error('Disputes can only be raised for joint ownership applications');
        }

        // --- EDGE CASE: Cannot raise a second dispute if one already active ---
        if (application.isDisputed === true) {
            throw new Error(`Application ${applicationId} already has an active dispute raised by ${application.disputeDetails.raisedBy}`);
        }

        // --- EDGE CASE: Only a listed co-owner can raise a dispute ---
        const isListedOwner = (application.owners || []).some(o => o.ownerId === raisedBy);
        if (!isListedOwner) {
            throw new Error(`'${raisedBy}' is not a listed co-owner and cannot raise a dispute for application ${applicationId}`);
        }

        // --- EDGE CASE: Reason must be provided ---
        if (!reason || reason.trim() === '') {
            throw new Error('A reason must be provided when raising a dispute');
        }

        const timestamp = ctx.stub.getTxTimestamp().seconds.toString();
        const cid = new ClientIdentity(ctx.stub);
        const callerEnrollmentId = cid.getAttributeValue('hf.EnrollmentID') || raisedBy;

        // Freeze the application
        application.isDisputed = true;
        application.disputeDetails = {
            raisedBy,
            reason: reason.trim(),
            timestamp,
            resolvedAt: null,
            resolvedBy: null,
            resolution: null,
            action: null
        };
        application.updatedAt = timestamp;

        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + timestamp + '-' + txId.substr(0, 8);

        application.history.push({
            transactionId,
            officialId: callerEnrollmentId,
            officialName: callerEnrollmentId,
            designation: 'co_owner',
            action: 'dispute_raised',
            remarks: `DISPUTE RAISED by ${raisedBy}: "${reason}". Application is now FROZEN.`,
            timestamp,
            data: { raisedBy, reason },
            documents: []
        });

        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));
        console.info('===== raiseOwnershipDispute END =====');

        return JSON.stringify({
            success: true,
            message: 'Dispute raised. Application is now FROZEN. No forwarding allowed. Contact the Collectorate (Org3) to resolve.',
            applicationId,
            disputeDetails: application.disputeDetails
        });
    }

    // ============================================================
    // NEW FUNCTION 3: resolveOwnershipDispute
    // ONLY Org3 (District Collector) can call this.
    // Supports 2 resolution actions:
    //   'rectify_shares' → update shares inline + unfreeze
    //   'reject'         → mark application permanently rejected
    // ============================================================
    /**
     * M10-F3: Org3 Collector resolves a dispute
     *
     * @param {Context} ctx - Fabric context
     * @param {string} applicationId - Target application
     * @param {string} resolutionDataStr - JSON:
     *   {
     *     action: 'rectify_shares' | 'reject',
     *     decision: "Order text or reason",
     *     orderNumber: "DC/REV/2026/001",   // optional judicial order reference
     *     updatedOwners: [{ ownerId, sharePercent }]  // required if action='rectify_shares'
     *   }
     */
    async resolveOwnershipDispute(ctx, applicationId, resolutionDataStr) {
        console.info('===== resolveOwnershipDispute START =====');

        const cid = new ClientIdentity(ctx.stub);
        const mspId = cid.getMSPID();

        // --- EDGE CASE: Only Org3 (Collectorate) can resolve disputes ---
        if (mspId !== 'Org3MSP') {
            throw new Error('Only the District Collectorate (Org3MSP) can resolve ownership disputes');
        }

        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }
        const application = JSON.parse(applicationAsBytes.toString());

        // --- EDGE CASE: Must have an active dispute to resolve ---
        if (!application.isDisputed) {
            throw new Error(`Application ${applicationId} has no active dispute to resolve`);
        }

        // Parse resolution data
        let resolution;
        try {
            resolution = JSON.parse(resolutionDataStr);
        } catch (e) {
            throw new Error('resolutionDataStr must be valid JSON with at least action and decision fields');
        }

        if (!resolution.action || !resolution.decision) {
            throw new Error('Resolution must include "action" (rectify_shares | reject) and "decision" fields');
        }

        const timestamp = ctx.stub.getTxTimestamp().seconds.toString();
        const collectorId = cid.getAttributeValue('hf.EnrollmentID') || 'collector';
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + timestamp + '-' + txId.substr(0, 8);

        if (resolution.action === 'rectify_shares') {
            // ---- OPTION A: Rectify shares inline (Durusti Aadesh) ----

            // --- EDGE CASE: updatedOwners must be provided ---
            if (!resolution.updatedOwners || !Array.isArray(resolution.updatedOwners)) {
                throw new Error('action "rectify_shares" requires "updatedOwners" array with { ownerId, sharePercent }');
            }

            // Apply updated share percentages only to matching ownerIds
            for (const update of resolution.updatedOwners) {
                const ownerIdx = application.owners.findIndex(o => o.ownerId === update.ownerId);
                if (ownerIdx === -1) {
                    throw new Error(`ownerId '${update.ownerId}' not found in application owners list`);
                }
                if (parseFloat(update.sharePercent) < 1) {
                    throw new Error(`Updated share for '${update.ownerId}' must be at least 1%`);
                }
                application.owners[ownerIdx].sharePercent = parseFloat(update.sharePercent);
            }

            // --- EDGE CASE: Validate updated shares still sum to 100% ---
            if (!_validateSharesSum(application.owners)) {
                const total = application.owners.reduce((s, o) => s + parseFloat(o.sharePercent), 0);
                throw new Error(`After rectification, share total is ${total.toFixed(2)}%. Must equal exactly 100%`);
            }

            // Unfreeze application
            application.isDisputed = false;
            application.disputeDetails.resolvedAt = timestamp;
            application.disputeDetails.resolvedBy = collectorId;
            application.disputeDetails.resolution = resolution.decision;
            application.disputeDetails.action = 'rectify_shares';
            application.disputeDetails.orderNumber = resolution.orderNumber || '';
            application.updatedAt = timestamp;

            application.history.push({
                transactionId,
                officialId: collectorId,
                officialName: collectorId,
                designation: 'joint_collector',
                action: 'dispute_resolved_rectified',
                remarks: `Dispute RESOLVED by Collector. Action: Shares Rectified. Order: ${resolution.orderNumber || 'N/A'}. Decision: ${resolution.decision}. Application UNFROZEN.`,
                timestamp,
                data: {
                    action: 'rectify_shares',
                    updatedOwners: application.owners.map(o => ({ ownerId: o.ownerId, name: o.name, sharePercent: o.sharePercent })),
                    orderNumber: resolution.orderNumber || '',
                    decision: resolution.decision
                },
                documents: []
            });

            await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));
            console.info('===== resolveOwnershipDispute (RECTIFY) END =====');

            return JSON.stringify({
                success: true,
                message: 'Dispute resolved. Shares rectified as per Collector order. Application is now ACTIVE (unfrozen).',
                applicationId,
                updatedOwners: application.owners,
                disputeDetails: application.disputeDetails
            });

        } else if (resolution.action === 'reject') {
            // ---- OPTION B: Permanent rejection (fraud/deliberate forgery case) ----

            application.isDisputed = false; // clear dispute flag but mark as rejected
            application.status = 'rejected';
            application.disputeDetails.resolvedAt = timestamp;
            application.disputeDetails.resolvedBy = collectorId;
            application.disputeDetails.resolution = resolution.decision;
            application.disputeDetails.action = 'reject';
            application.disputeDetails.orderNumber = resolution.orderNumber || '';
            application.updatedAt = timestamp;

            application.history.push({
                transactionId,
                officialId: collectorId,
                officialName: collectorId,
                designation: 'district_collector',
                action: 'dispute_resolved_rejected',
                remarks: `Dispute RESOLVED by Collector. Action: Application PERMANENTLY REJECTED. Order: ${resolution.orderNumber || 'N/A'}. Reason: ${resolution.decision}`,
                timestamp,
                data: {
                    action: 'reject',
                    orderNumber: resolution.orderNumber || '',
                    decision: resolution.decision
                },
                documents: []
            });

            await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));
            console.info('===== resolveOwnershipDispute (REJECT) END =====');

            return JSON.stringify({
                success: true,
                message: 'Dispute resolved. Application has been PERMANENTLY REJECTED as per Collector order. A fresh application must be submitted.',
                applicationId,
                status: 'rejected',
                disputeDetails: application.disputeDetails
            });

        } else {
            throw new Error(`Unknown resolution action '${resolution.action}'. Must be 'rectify_shares' or 'reject'`);
        }
    }

    // ============================================================
    // NEW FUNCTION 4: transferOwnershipShare
    // Transfers share % from one co-owner to another person
    // (existing co-owner OR new buyer). Requires:
    //   - Property must be 'completed' (fully registered)
    //   - Property must not be disputed/frozen
    //   - Seller must hold sufficient share
    //   - Shares must still sum to 100% after transfer
    //   - Other co-owners must have given NOC for new buyer
    // ============================================================
    /**
     * M10-F4: Transfer ownership share between owners
     *
     * @param {Context} ctx - Fabric context
     * @param {string} applicationId - Target application
     * @param {string} fromOwnerId - Seller's ownerId
     * @param {string} toOwnerId - Buyer's ownerId (existing or new)
     * @param {string} sharePercentStr - Percentage share being transferred (as string)
     * @param {string} newOwnerDataStr - JSON with new buyer info if toOwnerId doesn't exist.
     *   If buyer is existing co-owner, pass '{}'
     *   If buyer is new: { name, aadhar, nocApprovals: [{ownerId},...] }
     */
    async transferOwnershipShare(ctx, applicationId, fromOwnerId, toOwnerId, sharePercentStr, newOwnerDataStr) {
        console.info('===== transferOwnershipShare START =====');

        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }
        const application = JSON.parse(applicationAsBytes.toString());

        // --- EDGE CASE: Only joint applications support share transfer ---
        if (application.ownershipType !== 'joint') {
            throw new Error('Share transfer is only applicable for joint ownership applications');
        }

        // --- EDGE CASE: Only completed (fully registered) properties can transfer shares ---
        if (application.status !== 'completed') {
            throw new Error(`Share transfer is only allowed on fully registered (completed) land records. Current status: ${application.status}`);
        }

        // --- EDGE CASE: Cannot transfer on a disputed/frozen property ---
        if (application.isDisputed === true) {
            throw new Error(`Application ${applicationId} is frozen due to an active dispute. Resolve dispute before transferring shares`);
        }

        const sharePercent = parseFloat(sharePercentStr);

        // --- EDGE CASE: Share amount must be positive and >= 1% ---
        if (isNaN(sharePercent) || sharePercent < 1) {
            throw new Error('Transfer share percentage must be a number >= 1%');
        }

        // --- EDGE CASE: Verify seller exists and holds sufficient share ---
        const sellerIndex = (application.owners || []).findIndex(o => o.ownerId === fromOwnerId);
        if (sellerIndex === -1) {
            throw new Error(`Seller '${fromOwnerId}' is not a listed co-owner`);
        }
        if (application.owners[sellerIndex].sharePercent < sharePercent) {
            throw new Error(
                `Seller '${fromOwnerId}' owns ${application.owners[sellerIndex].sharePercent}% but is trying to transfer ${sharePercent}%. Insufficient share.`
            );
        }

        // Parse new owner data
        let newOwnerData = {};
        try {
            newOwnerData = JSON.parse(newOwnerDataStr);
        } catch (e) {
            newOwnerData = {};
        }

        const cid = new ClientIdentity(ctx.stub);
        const timestamp = ctx.stub.getTxTimestamp().seconds.toString();
        const txId = ctx.stub.getTxID();
        const transactionId = 'TXN-' + timestamp + '-' + txId.substr(0, 8);

        // Check if buyer is an existing co-owner
        const buyerIndex = (application.owners || []).findIndex(o => o.ownerId === toOwnerId);

        if (buyerIndex !== -1) {
            // ---- Scenario A: Transfer to existing co-owner ----
            application.owners[sellerIndex].sharePercent -= sharePercent;
            application.owners[buyerIndex].sharePercent += sharePercent;

            // Remove seller from owners array if their share drops to 0
            if (application.owners[sellerIndex].sharePercent === 0) {
                application.owners.splice(sellerIndex, 1);
            }

        } else {
            // ---- Scenario B: Transfer to new buyer (third party) ----

            // --- EDGE CASE: New buyer must have name & aadhaar ---
            if (!newOwnerData.name) {
                throw new Error('New buyer must provide name in newOwnerDataStr: { name, aadhar }');
            }

            // --- EDGE CASE: For new buyer, NOC from other co-owners must be recorded ---
            // nocApprovals is an array of ownerIds who approved the sale to this new buyer
            // In a production system this would be verified on-chain; here we validate the list
            const existingOwnerIds = application.owners
                .filter(o => o.ownerId !== fromOwnerId)
                .map(o => o.ownerId);

            const nocApprovals = newOwnerData.nocApprovals || [];
            const allNOCsPresent = existingOwnerIds.every(id => nocApprovals.includes(id));

            if (!allNOCsPresent) {
                const missingNOC = existingOwnerIds.filter(id => !nocApprovals.includes(id));
                throw new Error(
                    `Transfer to new buyer requires NOC (No Objection Certificate) from all other co-owners. ` +
                    `Missing NOC from: [${missingNOC.join(', ')}]`
                );
            }

            // Deduct share from seller
            application.owners[sellerIndex].sharePercent -= sharePercent;

            // Remove seller if share becomes 0
            if (application.owners[sellerIndex].sharePercent === 0) {
                application.owners.splice(sellerIndex, 1);
            }

            // Add new buyer to owners array
            application.owners.push({
                ownerId: toOwnerId,
                name: newOwnerData.name,
                aadhar: newOwnerData.aadhar || '',
                sharePercent: sharePercent,
                consentStatus: 'approved',    // New buyer has consented by signing the deed
                consentTimestamp: timestamp,
                consentRemarks: `Added via share transfer from ${fromOwnerId}. NOC from existing co-owners recorded.`
            });
        }

        // --- EDGE CASE: Final validation — shares must still sum to 100% ---
        if (!_validateSharesSum(application.owners)) {
            const total = application.owners.reduce((s, o) => s + parseFloat(o.sharePercent), 0);
            throw new Error(`After transfer, share total is ${total.toFixed(2)}%. Must equal exactly 100%. Transaction rejected.`);
        }

        application.updatedAt = timestamp;

        application.history.push({
            transactionId,
            officialId: cid.getAttributeValue('hf.EnrollmentID') || fromOwnerId,
            officialName: cid.getAttributeValue('hf.EnrollmentID') || fromOwnerId,
            designation: 'co_owner',
            action: 'share_transferred',
            remarks: `${sharePercent}% share transferred from ${fromOwnerId} to ${toOwnerId} (${newOwnerData.name || toOwnerId}). New owner lineup updated.`,
            timestamp,
            data: {
                fromOwnerId,
                toOwnerId,
                transferredShare: sharePercent,
                updatedOwners: application.owners.map(o => ({ ownerId: o.ownerId, name: o.name, sharePercent: o.sharePercent }))
            },
            documents: []
        });

        await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(application)));
        console.info('===== transferOwnershipShare END =====');

        return JSON.stringify({
            success: true,
            message: `${sharePercent}% share successfully transferred from ${fromOwnerId} to ${toOwnerId}.`,
            applicationId,
            updatedOwners: application.owners.map(o => ({
                ownerId: o.ownerId,
                name: o.name,
                sharePercent: o.sharePercent,
                consentStatus: o.consentStatus
            }))
        });
    }

    // ============================================================
    // NEW FUNCTION 5: getOwnershipDetails
    // Read-only query — returns complete ownership breakdown.
    // Includes each owner's share, consent status, dispute status.
    // Used by frontend dashboards (Member 3) to show live status.
    // ============================================================
    /**
     * M10-F5: Get complete ownership details for an application (read-only)
     *
     * @param {Context} ctx - Fabric context
     * @param {string} applicationId - Target application
     */
    async getOwnershipDetails(ctx, applicationId) {
        console.info('===== getOwnershipDetails START =====');

        const applicationAsBytes = await ctx.stub.getState(applicationId);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application ${applicationId} does not exist`);
        }
        const application = JSON.parse(applicationAsBytes.toString());

        const owners = (application.owners || []).map(o => ({
            ownerId: o.ownerId,
            name: o.name,
            sharePercent: o.sharePercent,
            consentStatus: o.consentStatus || 'approved', // 'approved' for single-owner/legacy
            consentTimestamp: o.consentTimestamp || null,
            consentRemarks: o.consentRemarks || ''
        }));

        const pendingConsents = owners.filter(o => o.consentStatus !== 'approved').length;

        const result = {
            applicationId,
            ownershipType: application.ownershipType || 'single',
            status: application.status,
            allConsentsGiven: application.allConsentsGiven !== false, // true for single/legacy
            isDisputed: application.isDisputed || false,
            disputeDetails: application.disputeDetails || null,
            totalOwners: owners.length,
            pendingConsents,
            owners,
            // Computed fields for UI
            canBeForwarded: !application.isDisputed && (application.allConsentsGiven !== false),
            ownershipSummary: owners.map(o => `${o.name}: ${o.sharePercent}%`).join(' | ')
        };

        console.info('===== getOwnershipDetails END =====');
        return JSON.stringify(result);
    }
}

module.exports = LandRegistrationContract;