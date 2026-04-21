import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const COOKIE_NAME = 'terminal_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ userId, token, expiresAt, ipAddress, userAgent });
  return { token, expiresAt };
}

export async function getSessionUser(token: string) {
  const result = await db.query.sessions.findFirst({
    where: and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())),
    with: { user: true },
  });
  return result?.user ?? null;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getTokenFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
