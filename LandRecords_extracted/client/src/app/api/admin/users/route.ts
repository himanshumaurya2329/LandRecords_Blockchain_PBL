import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';

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

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
