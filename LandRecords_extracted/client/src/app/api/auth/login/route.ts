import { NextRequest, NextResponse } from 'next/server';
import { apiCall } from '@/lib/fabric-api';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Call fabric-api login
    const result = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Login failed' },
        { status: 401 }
      );
    }

    // Create response with user data
    const response = NextResponse.json({
      message: 'Login successful',
      user: result.user,
    });

    // Set HTTP-only cookie with the JWT token
    response.cookies.set('fabric_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Also set user info in a regular cookie for client-side access
    response.cookies.set('fabric_user', JSON.stringify(result.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Login failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}