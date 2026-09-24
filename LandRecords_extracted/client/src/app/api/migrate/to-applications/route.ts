import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import LandApplication from '@/lib/models/LandApplication';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    console.log('=== STARTING MIGRATION ===');

    // Find all LandRequests with status 'with_clerk' that don't have corresponding LandApplications
    const landRequests = await LandRequest.find({ status: 'with_clerk' });
    console.log(`Found ${landRequests.length} land requests with status with_clerk`);

    let migratedCount = 0;

    for (const landRequest of landRequests) {
      const applicationId = `APP-${landRequest.receiptNumber}`;
      
      // Check if application already exists
      const existingApp = await LandApplication.findOne({ applicationId });
      if (existingApp) {
        console.log(`Application ${applicationId} already exists, skipping`);
        continue;
      }

      // Create LandApplication
      const application = await LandApplication.create({
        applicationId,
        landRequestId: landRequest._id.toString(),
        userName: landRequest.fullName,
        userEmail: landRequest.email,
        surveyNumber: landRequest.surveyNumber,
        landArea: landRequest.area,
        location: `${landRequest.address}, ${landRequest.city}, ${landRequest.state}`,
        currentStage: 'clerk',
        status: 'pending_clerk_review',
        receiptNumber: landRequest.receiptNumber,
        nature: landRequest.nature,
        ipfsHash: landRequest.ipfsHash,
      });

      console.log(`Created LandApplication: ${application._id}`);
      migratedCount++;
    }

    console.log(`=== MIGRATION COMPLETE: ${migratedCount} applications created ===`);

    return NextResponse.json(
      {
        message: `Successfully migrated ${migratedCount} applications`,
        migratedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
