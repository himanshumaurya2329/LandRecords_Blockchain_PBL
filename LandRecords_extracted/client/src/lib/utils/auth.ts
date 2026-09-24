import { cookies } from 'next/headers';
import { validateSession } from '@/lib/utils/session';

const SESSION_COOKIE_NAME = 'session_token';

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser() {
  const sessionToken = await getSessionFromCookies();

  if (!sessionToken) {
    return null;
  }

  const { valid, session } = await validateSession(sessionToken);

  if (!valid || !session) {
    return null;
  }

  return {
    sessionToken,
    userType: session.userType,
    userId: session.userId,
    officialId: session.officialId,
    expiresAt: session.expiresAt,
  };
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
