import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandApplication from '@/lib/models/LandApplication';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const allApplications = await LandApplication.find({}).sort({ createdAt: -1 });
    const clerkApplications = await LandApplication.find({ currentStage: 'clerk' }).sort({ createdAt: -1 });
    const superintendentApplications = await LandApplication.find({ currentStage: 'superintendent' }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        totalApplications: allApplications.length,
        clerkApplications: clerkApplications.length,
        superintendentApplications: superintendentApplications.length,
        allApplications: allApplications.map((app) => ({
          _id: app._id,
          applicationId: app.applicationId,
          userName: app.userName,
          currentStage: app.currentStage,
          createdAt: app.createdAt,
        })),
        clerkApps: clerkApplications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
