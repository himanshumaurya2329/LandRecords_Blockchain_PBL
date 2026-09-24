import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { getCurrentUser } from '@/lib/utils/auth';
import LandApplication from '@/lib/models/LandApplication';
import Official from '@/lib/models/Official';
import { DESIGNATION_TO_STAGE, NEXT_STAGE } from '@/lib/utils/workflow';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user || user.userType !== 'official') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { applicationId, action, comments } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get official details
    const official = await Official.findById(user.officialId);
    if (!official) {
      return NextResponse.json(
        { error: 'Official not found' },
        { status: 404 }
      );
    }

    // Get current stage based on designation
    const currentStage = DESIGNATION_TO_STAGE[official.designation];
    const nextStage = NEXT_STAGE[currentStage];

    // Find application
    const application = await LandApplication.findById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify application is at current stage
    if (application.currentStage !== currentStage) {
      return NextResponse.json(
        { error: 'Application is not at your stage' },
        { status: 400 }
      );
    }

    // Add to stage history
    application.stageHistory.push({
      stage: currentStage,
      officialId: user.officialId || '',
      officialName: `${official.firstName} ${official.lastName}`,
      officialDesignation: official.designation,
      status: action === 'approve' ? 'approved' : action === 'send_back' ? 'sent_back' : 'rejected',
      comments: comments || '',
      actionDate: new Date(),
    });

    // Update current stage
    if (action === 'approve' && nextStage && nextStage !== 'completed') {
      application.currentStage = nextStage as any;
    } else if (action === 'send_back') {
      // Send back to previous stage
      application.currentStage = 'clerk' as any;
    }

    await application.save();

    return NextResponse.json(
      {
        message: 'Application updated successfully',
        application,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
