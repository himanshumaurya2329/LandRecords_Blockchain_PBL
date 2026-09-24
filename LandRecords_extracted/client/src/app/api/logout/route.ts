import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/utils/session';
import { getSessionCookieName, getSessionFromCookies } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = await getSessionFromCookies();

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.delete(getSessionCookieName());

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
