'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromCookie,
  deleteSession,
} from '@/lib/auth/session';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

function generateSkyledgerId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const suffix = Date.now().toString().slice(-2);
  return `SL-${random}${suffix}`;
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (!user || !user.isActive) return { error: 'Invalid credentials' };

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: 'Invalid credentials' };

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? undefined;
  const ua = hdrs.get('user-agent') ?? undefined;

  const { token, expiresAt } = await createSession(user.id, ip, ua);
  await setSessionCookie(token, expiresAt);

  redirect('/dashboard');
}

export async function registerAction(_prev: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    department: formData.get('department') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });
  if (existing) return { error: 'Email already registered' };

  const passwordHash = await hashPassword(parsed.data.password);

  let skyledgerId = generateSkyledgerId();
  for (let i = 0; i < 10; i++) {
    const taken = await db.query.users.findFirst({
      where: eq(users.skyledgerId, skyledgerId),
    });
    if (!taken) break;
    skyledgerId = generateSkyledgerId();
  }

  const [newUser] = await db
    .insert(users)
    .values({ skyledgerId, name: parsed.data.name, email: parsed.data.email, passwordHash, department: parsed.data.department })
    .returning();

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? undefined;
  const ua = hdrs.get('user-agent') ?? undefined;

  const { token, expiresAt } = await createSession(newUser.id, ip, ua);
  await setSessionCookie(token, expiresAt);

  redirect('/dashboard');
}

export async function logoutAction() {
  const token = await getTokenFromCookie();
  if (token) await deleteSession(token);
  await clearSessionCookie();
  redirect('/login/auth');
}
