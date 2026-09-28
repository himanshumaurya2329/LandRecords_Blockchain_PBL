/**
 * Unit Test Suite for Joint Ownership Chaincode (Member 1)
 * Tests all edge cases discussed without needing a live Fabric network.
 * Run: node test_chaincode.js
 */

'use strict';

// ============================================================
// MINIMAL FABRIC CONTEXT MOCK
// ============================================================
class MockStub {
    constructor() {
        this._state = {};
        this._txId = 'mock-tx-id-abc123def456';
        this._txTimestamp = { seconds: Math.floor(Date.now() / 1000).toString() };
        this._transient = new Map();
        this._mspId = 'Org1MSP';
    }
    getState(key) {
        const val = this._state[key];
        return Promise.resolve(val ? Buffer.from(JSON.stringify(val)) : Buffer.alloc(0));
    }
    putState(key, value) {
        this._state[key] = JSON.parse(value.toString());
        return Promise.resolve();
    }
    getTxID() { return this._txId; }
    getTxTimestamp() { return this._txTimestamp; }
    getTransient() { return this._transient; }
    getStateByRange() {
        const entries = Object.entries(this._state);
        let idx = 0;
        return Promise.resolve({
            next: () => {
                if (idx < entries.length) {
                    const [key, val] = entries[idx++];
                    return Promise.resolve({ done: false, value: { key, value: Buffer.from(JSON.stringify(val)) } });
                }
                return Promise.resolve({ done: true });
            },
            close: () => Promise.resolve()
        });
    }
    createCompositeKey(prefix, parts) { return `${prefix}~${parts.join('~')}`; }
    getQueryResult() {
        return Promise.resolve({
            next: () => Promise.resolve({ done: true }),
            close: () => Promise.resolve()
        });
    }
}

class MockClientIdentity {
    constructor(mspId = 'Org1MSP', enrollmentId = 'testUser', role = 'applicant', id = 'testUser') {
        this._mspId = mspId;
        this._enrollmentId = enrollmentId;
        this._role = role;
        this._id = id;
    }
    getMSPID() { return this._mspId; }
    getAttributeValue(attr) {
        if (attr === 'hf.EnrollmentID') return this._enrollmentId;
        if (attr === 'role') return this._role;
        return null;
    }
    getID() { return this._id; }
}

function makeCtx(mspId = 'Org1MSP', role = 'applicant', enrollmentId = 'testUser') {
    const stub = new MockStub();
    stub._mspId = mspId;
    const cid = new MockClientIdentity(mspId, enrollmentId, role);
    return {
        stub,
        clientIdentity: cid,
        // some functions use `new ClientIdentity(ctx.stub)` → we patch it below
    };
}

// ============================================================
// PATCH: fabric-shim ClientIdentity used in some functions
// ============================================================
const Module = require('module');
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'fabric-shim') {
        return {
            ClientIdentity: class {
                constructor(stub) { this._stub = stub; }
                getMSPID() { return this._stub._mspId; }
                getAttributeValue(attr) {
                    if (attr === 'hf.EnrollmentID') return this._stub._mspId === 'Org3MSP' ? 'collector1' : 'user1';
                    if (attr === 'role') return 'applicant';
                    return null;
                }
                getID() { return 'testUser'; }
            }
        };
    }
    if (request === 'fabric-contract-api') {
        return {
            Contract: class Contract {
                constructor(name) { this.name = name; }
            },
            Context: class Context {}
        };
    }
    return originalLoad.apply(this, arguments);
};

// Load the contract
const LandRegistrationContract = require('./land-registration-contract.js');

// ============================================================
// TEST RUNNER
// ============================================================
let passed = 0;
let failed = 0;

async function test(description, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS: ${description}`);
        passed++;
    } catch (err) {
        console.log(`  ❌ FAIL: ${description}`);
        console.log(`     Error: ${err.message}`);
        failed++;
    }
}

async function expectError(description, fn, expectedSubstring) {
    try {
        await fn();
        console.log(`  ❌ FAIL: ${description} (expected error but none thrown)`);
        failed++;
    } catch (err) {
        if (expectedSubstring && !err.message.includes(expectedSubstring)) {
            console.log(`  ❌ FAIL: ${description}`);
            console.log(`     Expected error containing: "${expectedSubstring}"`);
            console.log(`     Got: "${err.message}"`);
            failed++;
        } else {
            console.log(`  ✅ PASS: ${description} (correctly threw: "${err.message.substring(0,80)}...")`);
            passed++;
        }
    }
}

// ============================================================
// HELPER: Create a completed joint application in the stub
// ============================================================
async function setupJointApp(stub, appId, owners, status = 'submitted') {
    const app = {
        applicationId: appId,
        userData: 'encryptedData',
        status,
        ownershipType: 'joint',
        owners: owners.map(o => ({
            ownerId: o.ownerId,
            name: o.name,
            aadhar: o.aadhar || '',
            sharePercent: parseFloat(o.sharePercent),
            consentStatus: o.consentStatus || 'pending',
            consentTimestamp: null,
            consentRemarks: ''
        })),
        allConsentsGiven: owners.every(o => o.consentStatus === 'approved'),
        isDisputed: false,
        disputeDetails: null,
        createdAt: '1000000',
        updatedAt: '1000000',
        history: [{ transactionId: 'TXN-init', action: 'created', timestamp: '1000000', documents: [] }]
    };
    stub._state[appId] = app;
    return app;
}

// ============================================================
// RUN ALL TESTS
// ============================================================
(async () => {
    const c = new LandRegistrationContract();

    // ============================================================
    console.log('\n━━━ GROUP 1: BACKWARD COMPATIBILITY (Single Owner) ━━━');
    // ============================================================

    await test('Single-owner app: createApplication() works without ownershipType field', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            fullName: 'Ramesh Kumar',
            aadhar: '111122223333'
        })));
        const result = JSON.parse(await c.createApplication(ctx, 'APP-SINGLE-001'));
        if (result.ownershipType !== 'single') throw new Error('Expected ownershipType = single');
        if (result.allConsentsGiven !== true) throw new Error('Expected allConsentsGiven = true for single owner');
        if (result.isDisputed !== false) throw new Error('Expected isDisputed = false');
        if (result.owners.length !== 0) throw new Error('Expected empty owners array for single');
    });

    await test('Single-owner app: forwardApplication() works without any consent guards', async () => {
        const ctx = makeCtx('Org1MSP', 'clerk', 'clerk1');
        ctx.stub._state['APP-SINGLE-001'] = {
            applicationId: 'APP-SINGLE-001', status: 'submitted',
            ownershipType: 'single', allConsentsGiven: true, isDisputed: false,
            owners: [], history: []
        };
        const result = JSON.parse(await c.forwardApplication(ctx, 'APP-SINGLE-001',
            JSON.stringify({ userRole: 'clerk', remarks: 'Forwarding' })));
        if (result.status !== 'with_superintendent') throw new Error('Status should have changed');
    });

    await test('Legacy app (no ownershipType field): forwardApplication() not broken', async () => {
        const ctx = makeCtx('Org1MSP', 'clerk', 'clerk1');
        ctx.stub._state['APP-LEGACY-001'] = {
            applicationId: 'APP-LEGACY-001', status: 'submitted',
            // NO ownershipType, allConsentsGiven, isDisputed fields (legacy record)
            history: []
        };
        // Should not throw — backward compat
        const result = JSON.parse(await c.forwardApplication(ctx, 'APP-LEGACY-001',
            JSON.stringify({ userRole: 'clerk', remarks: 'Old record' })));
        if (result.status !== 'with_superintendent') throw new Error('Legacy forward failed');
    });

    // ============================================================
    console.log('\n━━━ GROUP 2: createApplication() Joint Validation ━━━');
    // ============================================================

    await test('Joint app: creates successfully with 2 owners summing to 100%', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            fullName: 'Ramesh Kumar',
            ownershipType: 'joint',
            owners: [
                { ownerId: 'O1', name: 'Ramesh Kumar', aadhar: 'AAA', sharePercent: 50 },
                { ownerId: 'O2', name: 'Suresh Kumar', aadhar: 'BBB', sharePercent: 50 }
            ]
        })));
        const result = JSON.parse(await c.createApplication(ctx, 'APP-JOINT-001'));
        if (result.ownershipType !== 'joint') throw new Error('ownershipType mismatch');
        if (result.allConsentsGiven !== false) throw new Error('allConsentsGiven should be false initially');
        if (result.owners.length !== 2) throw new Error('Expected 2 owners');
        if (result.owners[0].consentStatus !== 'pending') throw new Error('Initial consent must be pending');
    });

    await expectError('Joint app: rejects if only 1 owner', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            ownershipType: 'joint',
            owners: [{ ownerId: 'O1', name: 'Ramesh', aadhar: 'AAA', sharePercent: 100 }]
        })));
        await c.createApplication(ctx, 'APP-JOINT-BAD-1');
    }, 'at least 2');

    await expectError('Joint app: rejects if 6 owners (max 5)', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            ownershipType: 'joint',
            owners: Array.from({ length: 6 }, (_, i) => ({
                ownerId: `O${i}`, name: `Owner${i}`, aadhar: `AAA${i}`, sharePercent: 16.67
            }))
        })));
        await c.createApplication(ctx, 'APP-JOINT-BAD-2');
    }, 'Maximum 5');

    await expectError('Joint app: rejects if shares sum to 90% (not 100%)', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            ownershipType: 'joint',
            owners: [
                { ownerId: 'O1', name: 'A', aadhar: '1', sharePercent: 50 },
                { ownerId: 'O2', name: 'B', aadhar: '2', sharePercent: 40 }
            ]
        })));
        await c.createApplication(ctx, 'APP-JOINT-BAD-3');
    }, '100%');

    await expectError('Joint app: rejects if owner has 0% share (less than 1%)', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            ownershipType: 'joint',
            owners: [
                { ownerId: 'O1', name: 'A', aadhar: '1', sharePercent: 100 },
                { ownerId: 'O2', name: 'B', aadhar: '2', sharePercent: 0 }
            ]
        })));
        await c.createApplication(ctx, 'APP-JOINT-BAD-4');
    }, 'at least 1%');

    await expectError('Joint app: rejects if duplicate ownerIds', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._transient.set('userData', Buffer.from(JSON.stringify({
            ownershipType: 'joint',
            owners: [
                { ownerId: 'O1', name: 'A', aadhar: '1', sharePercent: 50 },
                { ownerId: 'O1', name: 'B', aadhar: '2', sharePercent: 50 }   // duplicate
            ]
        })));
        await c.createApplication(ctx, 'APP-JOINT-BAD-5');
    }, 'Duplicate ownerId');

    // ============================================================
    console.log('\n━━━ GROUP 3: addCoOwnerConsent() ━━━');
    // ============================================================

    await test('Co-owner gives consent → pending count decreases', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-C-001', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 60, consentStatus: 'pending' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 40, consentStatus: 'pending' }
        ]);
        const result = JSON.parse(await c.addCoOwnerConsent(ctx, 'APP-C-001', 'O1',
            JSON.stringify({ remarks: 'I agree' })));
        if (result.allConsentsGiven !== false) throw new Error('Should still be false (O2 pending)');
        if (result.pendingConsents !== 1) throw new Error('Expected 1 pending');
    });

    await test('Last co-owner consent → allConsentsGiven becomes true', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-C-002', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 40, consentStatus: 'pending' }
        ]);
        const result = JSON.parse(await c.addCoOwnerConsent(ctx, 'APP-C-002', 'O2',
            JSON.stringify({ remarks: 'Approved' })));
        if (!result.allConsentsGiven) throw new Error('allConsentsGiven should be true now');
        if (result.pendingConsents !== 0) throw new Error('No pending consents expected');
    });

    await expectError('Consent: rejects if ownerId not in list', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-C-003', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 100, consentStatus: 'pending' }
        ]);
        await c.addCoOwnerConsent(ctx, 'APP-C-003', 'O-FAKE', JSON.stringify({ remarks: 'X' }));
    }, 'not listed');

    await expectError('Consent: rejects double consent', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-C-004', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 40, consentStatus: 'pending' }
        ]);
        await c.addCoOwnerConsent(ctx, 'APP-C-004', 'O1', JSON.stringify({ remarks: 'Again' }));
    }, 'already given consent');

    // ============================================================
    console.log('\n━━━ GROUP 4: forwardApplication() Guards ━━━');
    // ============================================================

    await expectError('Forward BLOCKED: joint app with pending consents', async () => {
        const ctx = makeCtx('Org1MSP', 'clerk', 'clerk1');
        await setupJointApp(ctx.stub, 'APP-F-001', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'pending' }
        ]);
        await c.forwardApplication(ctx, 'APP-F-001',
            JSON.stringify({ userRole: 'clerk', remarks: 'Forward' }));
    }, 'Not all co-owners');

    await test('Forward ALLOWED: joint app with all consents given', async () => {
        const ctx = makeCtx('Org1MSP', 'clerk', 'clerk1');
        await setupJointApp(ctx.stub, 'APP-F-002', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'approved' }
        ]);
        const result = JSON.parse(await c.forwardApplication(ctx, 'APP-F-002',
            JSON.stringify({ userRole: 'clerk', remarks: 'All consented' })));
        if (result.status !== 'with_superintendent') throw new Error('Should have forwarded');
    });

    await expectError('Forward BLOCKED: disputed/frozen application', async () => {
        const ctx = makeCtx('Org1MSP', 'clerk', 'clerk1');
        const app = await setupJointApp(ctx.stub, 'APP-F-003', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'approved' }
        ]);
        // Manually freeze
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O2', reason: 'Wrong share' };
        ctx.stub._state['APP-F-003'] = app;

        await c.forwardApplication(ctx, 'APP-F-003',
            JSON.stringify({ userRole: 'clerk', remarks: 'Try forward' }));
    }, 'FROZEN');

    // ============================================================
    console.log('\n━━━ GROUP 5: raiseOwnershipDispute() ━━━');
    // ============================================================

    await test('Dispute raised: isDisputed=true, application frozen', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-D-001', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 70, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 30, consentStatus: 'approved' }
        ]);
        const result = JSON.parse(await c.raiseOwnershipDispute(ctx, 'APP-D-001', 'O2',
            'My share is 50% not 30%'));
        if (!result.success) throw new Error('Should succeed');
        const app = ctx.stub._state['APP-D-001'];
        if (!app.isDisputed) throw new Error('isDisputed should be true');
        if (app.disputeDetails.raisedBy !== 'O2') throw new Error('raisedBy mismatch');
    });

    await expectError('Dispute: non-owner cannot raise dispute', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-D-002', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'approved' }
        ]);
        await c.raiseOwnershipDispute(ctx, 'APP-D-002', 'O-FAKE', 'I want to dispute');
    }, 'not a listed co-owner');

    await expectError('Dispute: double dispute not allowed', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        const app = await setupJointApp(ctx.stub, 'APP-D-003', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'approved' }
        ]);
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O1', reason: 'First dispute' };
        ctx.stub._state['APP-D-003'] = app;
        await c.raiseOwnershipDispute(ctx, 'APP-D-003', 'O2', 'Second dispute');
    }, 'already has an active dispute');

    await expectError('Dispute: empty reason rejected', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-D-004', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'approved' }
        ]);
        await c.raiseOwnershipDispute(ctx, 'APP-D-004', 'O1', '   ');
    }, 'reason must be provided');

    // ============================================================
    console.log('\n━━━ GROUP 6: resolveOwnershipDispute() ━━━');
    // ============================================================

    await test('Resolve RECTIFY: shares updated & application unfrozen', async () => {
        const ctx = makeCtx('Org3MSP', 'collector', 'collector1');
        ctx.stub._mspId = 'Org3MSP'; // Org3 collector
        const app = await setupJointApp(ctx.stub, 'APP-R-001', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 70, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 30, consentStatus: 'approved' }
        ]);
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O2', reason: 'Wrong share' };
        ctx.stub._state['APP-R-001'] = app;

        const result = JSON.parse(await c.resolveOwnershipDispute(ctx, 'APP-R-001', JSON.stringify({
            action: 'rectify_shares',
            decision: 'O2 share corrected to 50% per order DC-001',
            orderNumber: 'DC/REV/2026/001',
            updatedOwners: [
                { ownerId: 'O1', sharePercent: 50 },
                { ownerId: 'O2', sharePercent: 50 }
            ]
        })));
        if (!result.success) throw new Error('Should succeed');
        const updated = ctx.stub._state['APP-R-001'];
        if (updated.isDisputed) throw new Error('Should be unfrozen');
        const o2 = updated.owners.find(o => o.ownerId === 'O2');
        if (o2.sharePercent !== 50) throw new Error(`O2 share should be 50 but got ${o2.sharePercent}`);
    });

    await test('Resolve REJECT: application permanently rejected', async () => {
        const ctx = makeCtx('Org3MSP', 'collector', 'collector1');
        ctx.stub._mspId = 'Org3MSP';
        const app = await setupJointApp(ctx.stub, 'APP-R-002', [
            { ownerId: 'O1', name: 'A', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 40, consentStatus: 'approved' }
        ]);
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O2', reason: 'Fraud detected' };
        ctx.stub._state['APP-R-002'] = app;

        const result = JSON.parse(await c.resolveOwnershipDispute(ctx, 'APP-R-002', JSON.stringify({
            action: 'reject',
            decision: 'Deliberate forgery confirmed. Application rejected.',
            orderNumber: 'DC/REV/2026/002'
        })));
        if (result.status !== 'rejected') throw new Error('Status should be rejected');
    });

    await expectError('Resolve: only Org3 can resolve (Org1 attempt rejected)', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._mspId = 'Org1MSP';
        const app = await setupJointApp(ctx.stub, 'APP-R-003', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 50, consentStatus: 'approved' }
        ]);
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O2', reason: 'Issue' };
        ctx.stub._state['APP-R-003'] = app;

        await c.resolveOwnershipDispute(ctx, 'APP-R-003', JSON.stringify({
            action: 'rectify_shares',
            decision: 'Test',
            updatedOwners: [{ ownerId: 'O1', sharePercent: 50 }, { ownerId: 'O2', sharePercent: 50 }]
        }));
    }, 'Org3MSP');

    await expectError('Resolve RECTIFY: invalid shares (total != 100%) rejected', async () => {
        const ctx = makeCtx('Org3MSP', 'collector', 'collector1');
        ctx.stub._mspId = 'Org3MSP';
        const app = await setupJointApp(ctx.stub, 'APP-R-004', [
            { ownerId: 'O1', name: 'A', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 40, consentStatus: 'approved' }
        ]);
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O2', reason: 'Test' };
        ctx.stub._state['APP-R-004'] = app;

        await c.resolveOwnershipDispute(ctx, 'APP-R-004', JSON.stringify({
            action: 'rectify_shares',
            decision: 'Bad rectification',
            updatedOwners: [
                { ownerId: 'O1', sharePercent: 60 },  // still 60+40=100 → let's try a bad combo
                { ownerId: 'O2', sharePercent: 60 }   // 60+60=120 → should fail
            ]
        }));
    }, 'Must equal exactly 100%');

    // ============================================================
    console.log('\n━━━ GROUP 7: transferOwnershipShare() ━━━');
    // ============================================================

    await test('Transfer to existing co-owner: shares rebalanced', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-T-001', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 70, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 30, consentStatus: 'approved' }
        ], 'completed');
        const result = JSON.parse(await c.transferOwnershipShare(ctx, 'APP-T-001', 'O1', 'O2', '20', '{}'));
        const o1 = result.updatedOwners.find(o => o.ownerId === 'O1');
        const o2 = result.updatedOwners.find(o => o.ownerId === 'O2');
        if (o1.sharePercent !== 50) throw new Error(`O1 should have 50% but got ${o1.sharePercent}`);
        if (o2.sharePercent !== 50) throw new Error(`O2 should have 50% but got ${o2.sharePercent}`);
    });

    await test('Transfer to new buyer with NOC: buyer added to owners', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-T-002', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 70, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 30, consentStatus: 'approved' }
        ], 'completed');
        const newBuyerData = { name: 'Vijay', aadhar: 'CCC', nocApprovals: ['O2'] };
        const result = JSON.parse(await c.transferOwnershipShare(
            ctx, 'APP-T-002', 'O1', 'O3-NEW', '30',
            JSON.stringify(newBuyerData)
        ));
        const newBuyer = result.updatedOwners.find(o => o.ownerId === 'O3-NEW');
        if (!newBuyer) throw new Error('New buyer not added to owners');
        if (newBuyer.sharePercent !== 30) throw new Error(`Buyer should have 30% but got ${newBuyer.sharePercent}`);
    });

    await expectError('Transfer: only allowed on completed properties', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-T-003', [
            { ownerId: 'O1', name: 'A', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 40, consentStatus: 'approved' }
        ], 'with_collector'); // NOT completed
        await c.transferOwnershipShare(ctx, 'APP-T-003', 'O1', 'O2', '20', '{}');
    }, 'completed');

    await expectError('Transfer: blocked on disputed property', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        const app = await setupJointApp(ctx.stub, 'APP-T-004', [
            { ownerId: 'O1', name: 'A', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 40, consentStatus: 'approved' }
        ], 'completed');
        app.isDisputed = true;
        app.disputeDetails = { raisedBy: 'O2', reason: 'Dispute' };
        ctx.stub._state['APP-T-004'] = app;
        await c.transferOwnershipShare(ctx, 'APP-T-004', 'O1', 'O2', '20', '{}');
    }, 'frozen');

    await expectError('Transfer: seller cannot transfer more than they own', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-T-005', [
            { ownerId: 'O1', name: 'A', sharePercent: 30, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 70, consentStatus: 'approved' }
        ], 'completed');
        await c.transferOwnershipShare(ctx, 'APP-T-005', 'O1', 'O2', '50', '{}'); // O1 only has 30
    }, 'Insufficient share');

    await expectError('Transfer: new buyer needs NOC from all other co-owners', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-T-006', [
            { ownerId: 'O1', name: 'A', sharePercent: 50, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'B', sharePercent: 30, consentStatus: 'approved' },
            { ownerId: 'O3', name: 'C', sharePercent: 20, consentStatus: 'approved' }
        ], 'completed');
        // O1 selling to new buyer, NOC only from O2 but not O3
        const newBuyerData = { name: 'Vijay', aadhar: 'CCC', nocApprovals: ['O2'] };
        await c.transferOwnershipShare(ctx, 'APP-T-006', 'O1', 'NEW', '20', JSON.stringify(newBuyerData));
    }, 'Missing NOC from');

    // ============================================================
    console.log('\n━━━ GROUP 8: getOwnershipDetails() ━━━');
    // ============================================================

    await test('getOwnershipDetails: returns correct summary', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        await setupJointApp(ctx.stub, 'APP-G-001', [
            { ownerId: 'O1', name: 'Ramesh', sharePercent: 60, consentStatus: 'approved' },
            { ownerId: 'O2', name: 'Suresh', sharePercent: 40, consentStatus: 'pending' }
        ]);
        const result = JSON.parse(await c.getOwnershipDetails(ctx, 'APP-G-001'));
        if (result.totalOwners !== 2) throw new Error('Expected 2 owners');
        if (result.pendingConsents !== 1) throw new Error('Expected 1 pending');
        if (result.allConsentsGiven !== false) throw new Error('Expected false');
        if (result.canBeForwarded) throw new Error('canBeForwarded should be false');
    });

    await test('getOwnershipDetails: single/legacy app returns safe defaults', async () => {
        const ctx = makeCtx('Org1MSP', 'applicant', 'user1');
        ctx.stub._state['APP-G-002'] = {
            applicationId: 'APP-G-002', status: 'submitted',
            history: []
            // No ownershipType, allConsentsGiven, etc. (legacy)
        };
        const result = JSON.parse(await c.getOwnershipDetails(ctx, 'APP-G-002'));
        if (result.ownershipType !== 'single') throw new Error('Should default to single');
        if (!result.canBeForwarded) throw new Error('Legacy apps should be forwardable');
    });

    // ============================================================
    // FINAL RESULT
    // ============================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`TEST RESULTS: ${passed} passed | ${failed} failed | ${passed + failed} total`);
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED — Chaincode is safe to deploy!');
    } else {
        console.log('⚠️  SOME TESTS FAILED — Fix issues before deploying!');
        process.exit(1);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();
