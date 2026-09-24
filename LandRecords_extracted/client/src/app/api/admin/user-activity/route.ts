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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user details to get their username
    const User = (await import('@/lib/models/User')).default;
    const user = await User.findById(userId).select('username email');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all applications by this user (match by createdBy field which should be userId)
    // First try by userId, if none found, try by username in fullName or email
    let applications = await LandRequest.find({ createdBy: userId })
      .select('receiptNumber ownerName status createdAt actionHistory')
      .sort({ createdAt: -1 });

    // If no applications found by userId, try finding by email as fallback
    if (applications.length === 0) {
      applications = await LandRequest.find({ email: user.email })
        .select('receiptNumber ownerName status createdAt actionHistory')
        .sort({ createdAt: -1 });
    }

    // Get activity summary
    const totalApplications = applications.length;
    const completed = applications.filter(app => app.status === 'completed').length;
    const pending = applications.filter(app => app.status.includes('with_')).length;
    const rejected = applications.filter(app => app.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      applications,
      summary: {
        totalApplications,
        completed,
        pending,
        rejected,
      },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
