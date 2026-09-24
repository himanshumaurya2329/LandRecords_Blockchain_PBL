import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Session from '@/lib/models/Session';
import Official from '@/lib/models/Official';

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

    const officials = await Official.find().select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      officials,
    });
  } catch (error) {
    console.error('Error fetching officials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
