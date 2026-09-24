import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Session from '@/lib/models/Session';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const session = await Session.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() },
      userType: 'admin'
    });

    if (!session || !session.adminId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const officialId = searchParams.get('officialId');

    if (!officialId) {
      return NextResponse.json({ error: 'Official ID required' }, { status: 400 });
    }

    // Get all applications where this official appears in action history
    const applications = await LandRequest.find({
      'actionHistory.officialId': officialId
    }).select('receiptNumber ownerName status createdAt actionHistory');

    // Calculate statistics
    const totalProcessed = applications.length;
    let approved = 0;
    let rejected = 0;
    let pending = 0;

    applications.forEach((app: any) => {
      const officialAction = app.actionHistory?.find(
        (action: any) => action.officialId === officialId
      );
      
      if (officialAction) {
        if (officialAction.action === 'approved' || officialAction.action === 'forwarded') {
          approved++;
        } else if (officialAction.action === 'rejected') {
          rejected++;
        }
      }
      
      // Check if currently with this official
      if (app.currentlyWith === officialId) {
        pending++;
      }
    });

    // Get applications currently with this official
    const currentApplications = await LandRequest.find({
      currentlyWith: officialId
    }).select('receiptNumber ownerName status createdAt');

    return NextResponse.json({
      success: true,
      applications: applications.map((app: any) => ({
        receiptNumber: app.receiptNumber,
        ownerName: app.ownerName,
        status: app.status,
        createdAt: app.createdAt,
        officialAction: app.actionHistory?.find((a: any) => a.officialId === officialId),
      })),
      currentApplications,
      summary: {
        totalProcessed,
        approved,
        rejected,
        pending: currentApplications.length,
      },
    });
  } catch (error) {
    console.error('Error fetching official activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
