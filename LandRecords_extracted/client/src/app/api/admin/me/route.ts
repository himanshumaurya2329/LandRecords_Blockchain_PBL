import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Admin from '@/lib/models/Admin';
import Session from '@/lib/models/Session';

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

    const admin = await Admin.findById(session.adminId).select('-password');

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
