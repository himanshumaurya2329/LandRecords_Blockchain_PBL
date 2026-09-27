import { NextRequest, NextResponse } from 'next/server';
import { apiCall } from '@/lib/fabric-api';
import connectDB from '@/lib/db/connect';
import Official from '@/lib/models/Official';
import Session from '@/lib/models/Session';
import LandRequest from '@/lib/models/LandRequest';
import { getAssignedStatusesForRole } from '@/lib/utils/workflow';

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

    const userRole = (official.designation || '').toLowerCase().trim();
    const targetStatuses = getAssignedStatusesForRole(userRole);

    // Fetch counts from MongoDB
    const assignedFilter = {
      status: { $in: targetStatuses.map(s => new RegExp(`^${s}$`, 'i')) }
    };

    const [totalMongo, pendingMongo, approvedMongo, rejectedMongo] = await Promise.all([
      LandRequest.countDocuments(),
      LandRequest.countDocuments(assignedFilter),
      LandRequest.countDocuments({ status: { $in: ['approved', 'completed'] } }),
      LandRequest.countDocuments({ status: 'rejected' }),
    ]);

    let total = totalMongo;
    let pending = pendingMongo;
    let approved = approvedMongo;
    let rejected = rejectedMongo;

    // Also consult Fabric API if available
    try {
      const result = await apiCall('/api/land/applications', {}, req);
      if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
        const apps = result.data.map((item: any) => item.Record || item);
        total = Math.max(totalMongo, apps.length);

        const fabricPending = apps.filter((app: any) => {
          const s = (app.status || '').toLowerCase();
          return targetStatuses.some(ts => s === ts.toLowerCase() || s.includes(ts.toLowerCase()));
        }).length;

        if (fabricPending > pending) {
          pending = fabricPending;
        }

        const fabricApproved = apps.filter((app: any) => ['approved', 'completed'].includes((app.status || '').toLowerCase())).length;
        if (fabricApproved > approved) approved = fabricApproved;

        const fabricRejected = apps.filter((app: any) => (app.status || '').toLowerCase() === 'rejected').length;
        if (fabricRejected > rejected) rejected = fabricRejected;
      }
    } catch (fabricErr) {
      console.warn('[Stats] Fabric stats fetch failed, relying on MongoDB stats:', fabricErr);
    }

    console.log(`[Stats] Calculated for ${official.username} (${userRole}) - Total: ${total}, Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}`);

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
