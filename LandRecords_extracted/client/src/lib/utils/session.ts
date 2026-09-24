import { randomBytes } from 'crypto';
import Session, { ISession } from '@/lib/models/Session';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(
  userId: string | undefined,
  officialId: string | undefined,
  userType: 'user' | 'official'
): Promise<ISession> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const session = new Session({
    userId,
    officialId,
    userType,
    sessionToken,
    expiresAt,
  });

  await session.save();
  return session;
}

export async function getSession(sessionToken: string): Promise<ISession | null> {
  try {
    // Add a timeout to the query
    const sessionPromise = Session.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() },
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 8000)
    );

    const session = await Promise.race([sessionPromise, timeoutPromise]);
    return session || null;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

export async function deleteSession(sessionToken: string): Promise<boolean> {
  const result = await Session.deleteOne({ sessionToken });
  return result.deletedCount > 0;
}

export async function validateSession(
  sessionToken: string
): Promise<{ valid: boolean; session?: ISession }> {
  const session = await getSession(sessionToken);

  if (!session) {
    return { valid: false };
  }

  if (new Date() > session.expiresAt) {
    await deleteSession(sessionToken);
    return { valid: false };
  }

  return { valid: true, session };
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  };
}
