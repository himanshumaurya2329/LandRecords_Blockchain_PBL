import { NextRequest, NextResponse } from 'next/server';
import { apiCall, auth } from '@/lib/fabric-api';
import crypto from 'crypto';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import { getCurrentUser } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phoneNumber,
      aadharNumber,
      dob,
      ownerName,
      surveyNumber,
      area,
      address,
      state,
      city,
      pincode,
      nature,
      ipfsHash,
      ownershipType = 'single',
      owners,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !aadharNumber || !dob || !ownerName || !surveyNumber || !area || !address || !state || !city || !pincode || !ipfsHash) {
      return NextResponse.json(
        { message: 'Missing required fields: fullName, email, phoneNumber, aadharNumber, dob, ownerName, surveyNumber, area, address, state, city, pincode, ipfsHash' },
        { status: 400 }
      );
    }

    // Validate joint ownership owners if joint
    if (ownershipType === 'joint') {
      if (!owners || !Array.isArray(owners) || owners.length < 2) {
        return NextResponse.json(
          { message: 'Joint ownership requires at least 2 co-owners with valid share percentages.' },
          { status: 400 }
        );
      }
      const totalShare = owners.reduce((s: number, o: any) => s + parseFloat(o.sharePercent || 0), 0);
      if (Math.abs(totalShare - 100) > 0.01) {
        return NextResponse.json(
          { message: `Co-owner shares must sum to exactly 100%. Current total: ${totalShare}%` },
          { status: 400 }
        );
      }
    }

    // Validate date of birth
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date of birth format' },
        { status: 400 }
      );
    }

    // Get current user
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique application ID
    const applicationId = 'APP-' + crypto.randomBytes(8).toString('hex').toUpperCase();

    // Prepare user data for blockchain
    const formattedOwners = ownershipType === 'joint' && Array.isArray(owners)
      ? owners.map((o: any, idx: number) => ({
          ownerId: o.ownerId || (idx === 0 ? session.userId : `owner_${idx + 1}`),
          name: o.name || (idx === 0 ? fullName : ''),
          aadhar: o.aadhar || (idx === 0 ? aadharNumber : ''),
          sharePercent: parseFloat(o.sharePercent),
          consentStatus: idx === 0 ? 'consented' : 'pending',
          consentTimestamp: idx === 0 ? new Date().toISOString() : '',
          remarks: idx === 0 ? 'Primary applicant' : '',
        }))
      : [];

    const userData: any = {
      fullName,
      email,
      phoneNumber,
      aadharNumber,
      dob,
      ownerName,
      surveyNumber,
      area,
      address,
      state,
      city,
      pincode,
      nature,
      ipfsHash,
      ownershipType,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (ownershipType === 'joint') {
      userData.owners = formattedOwners;
      userData.primaryOwner = session.userId;
      userData.allConsentsGiven = false;
    }

    // Call fabric-api to create application on blockchain (non-fatal if offline)
    let blockchainTxId = null;
    try {
      const result = await apiCall('/api/land/applications', {
        method: 'POST',
        body: JSON.stringify({ applicationId, userData }),
      }, req);
      blockchainTxId = result.data?.txId;
      console.log(`Land application ${applicationId} created on blockchain`);
    } catch (blockchainErr) {
      console.warn('Blockchain call failed (non-fatal):', blockchainErr instanceof Error ? blockchainErr.message : blockchainErr);
    }

    const docHash = crypto.createHash('sha256').update(surveyNumber + ownerName + ipfsHash).digest('hex');

    // Save to MongoDB
    await connectDB();
    const landRequest = new LandRequest({
      receiptNumber: applicationId,
      nature,
      createdBy: session.userId,
      fullName,
      email,
      phoneNumber,
      aadharNumber,
      dob: parsedDob,
      ownerName,
      surveyNumber,
      area,
      address,
      state,
      city,
      pincode,
      ipfsHash,
      docHash,
      ownershipType,
      owners: formattedOwners,
      allConsentsGiven: ownershipType !== 'joint',
      isDisputed: false,
      status: 'submitted',
    });

    await landRequest.save();
    console.log(`Land request ${applicationId} saved to database`);

    return NextResponse.json({
      receiptNumber: applicationId,
      id: applicationId,
      message: 'Land application created successfully',
      blockchainTxId,
    });
  } catch (error) {
    console.error('Create land application error:', error);
    return NextResponse.json(
      { message: 'Failed to create land application', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
