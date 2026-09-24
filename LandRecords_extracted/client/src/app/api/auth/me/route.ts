import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId).select('-password');

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User authenticated',
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        aadhar: user.aadhar,
        dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0], // Format as YYYY-MM-DD
        did: user.did || '',
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { message: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
