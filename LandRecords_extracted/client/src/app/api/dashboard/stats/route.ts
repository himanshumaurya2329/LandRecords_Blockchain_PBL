import { NextRequest, NextResponse } from 'next/server';
import { apiCall } from '@/lib/fabric-api';
import connectDB from '@/lib/db/connect';
import Official from '@/lib/models/Official';
import Session from '@/lib/models/Session';

export async function GET(req: NextRequest) {
  try {
    // Authenticate using session token
    const cookieStore = req.cookies;
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Connect to DB if not already connected
    await connectDB();

    // Get official from session
    const session = await Session.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session || !session.officialId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }

    const official = await Official.findById(session.officialId).select('-password');

    if (!official) {
      return NextResponse.json({ error: 'Official not found' }, { status: 404 });
    }

    // Get official ID from user (official object)
    // We don't really use officialIdStr for filtering yet, as the API returns ALL apps
    // But we might want to filter stats based on this later if needed.
    // For now, calculating generic stats or stats relevant to the role.
    const officialIdStr = official._id.toString();

    // Get all applications from fabric-api
    const result = await apiCall('/api/land/applications', {}, req);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    const allApplications = result.data || [];

    // Calculate stats based on applications assigned to this official
    const total = allApplications.length;
    const pending = allApplications.filter((app: any) => app.status === 'pending').length;
    const approved = allApplications.filter((app: any) => app.status === 'approved').length;
    const rejected = allApplications.filter((app: any) => app.status === 'rejected').length;

    console.log(`[Stats] Calculated - Total: ${total}, Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}`);

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
