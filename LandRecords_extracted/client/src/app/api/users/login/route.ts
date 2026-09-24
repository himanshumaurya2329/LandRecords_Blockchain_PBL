import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import { createSession, getSessionCookieOptions } from '@/lib/utils/session';
import { getSessionCookieName } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user._id.toString(), undefined, 'user');

    // Create response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set(
      getSessionCookieName(),
      session.sessionToken,
      getSessionCookieOptions()
    );

    return response;
  } catch (error) {
    console.error('User login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
