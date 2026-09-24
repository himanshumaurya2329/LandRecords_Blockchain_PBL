import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getCurrentUser();
    if (!session || session.userType !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
