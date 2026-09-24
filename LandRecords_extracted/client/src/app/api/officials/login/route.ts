import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import Official from '@/lib/models/Official';
import { createSession, getSessionCookieOptions } from '@/lib/utils/session';
import { getSessionCookieName } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { username, password, designation } = body;

    // Validate input
    if (!username || !password || !designation) {
      return NextResponse.json(
        { error: 'Username, password, and designation are required' },
        { status: 400 }
      );
    }

    // Find official by username and designation
    const official = await Official.findOne({
      username,
      designation,
    }).select('+password');

    if (!official) {
      return NextResponse.json(
        { error: 'Invalid username, password, or designation' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, official.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username, password, or designation' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(undefined, official._id.toString(), 'official');

    // Create response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        official: {
          id: official._id,
          username: official.username,
          firstName: official.firstName,
          lastName: official.lastName,
          designation: official.designation,
          officeId: official.officeId,
          email: official.email,
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
    console.error('Official login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
