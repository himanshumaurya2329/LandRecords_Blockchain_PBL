import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch all applications from MongoDB
    const applications = await LandRequest.find().sort({ createdAt: -1 });

    // Format applications for dashboard using expected field names
    const formattedApplications = applications.map((app: any) => ({
      _id: app._id,
      receiptNumber: app.receiptNumber,
      ownerName: app.ownerName,
      surveyNumber: app.surveyNumber,
      area: app.area,
      address: app.address,
      state: app.state,
      city: app.city,
      pincode: app.pincode,
      nature: app.nature,
      status: app.status,
      createdAt: app.createdAt,
      fullName: app.fullName,
      email: app.email,
      ipfsHash: app.ipfsHash,
      currentlyWithName: getOfficialNameByCurrentStage(app.status),
    }));

    return NextResponse.json({
      applications: formattedApplications,
      totalCount: formattedApplications.length,
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return NextResponse.json(
      {
        applications: [],
        error: 'Failed to fetch applications'
      },
      { status: 500 }
    );
  }
}

// Helper function to get official name based on current stage
function getOfficialNameByCurrentStage(stage: string): string {
  switch (stage) {
    case 'clerk':
    case 'superintendent':
      return 'Registration Clerk';
    case 'mro':
    case 'vro':
    case 'revenue_officer':
    case 'revenue_dept':
      return 'Revenue Officer';
    case 'surveyor':
      return 'Survey Officer';
    case 'joint_collector':
    case 'collector':
    case 'ministry_welfare':
      return 'District Collector';
    default:
      return 'Processing';
  }
}
