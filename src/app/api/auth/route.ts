import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { eq } from 'drizzle-orm';

function generateSkyledgerId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SL-${random}${Date.now().toString().slice(-2)}`;
}

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires: expiresAt,
    path: '/',
  };
}

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  try {
    if (action === 'login') {
      const body = await request.json();
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
      if (!user || !user.isActive) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const valid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const ip = request.headers.get('x-forwarded-for') ?? undefined;
      const ua = request.headers.get('user-agent') ?? undefined;
      const { token, expiresAt } = await createSession(user.id, ip, ua);

      const res = NextResponse.json({
        success: true,
        user: { id: user.id, skyledgerId: user.skyledgerId, name: user.name, role: user.role },
      });
      res.cookies.set('terminal_session', token, sessionCookieOptions(expiresAt));
      return res;
    }

    if (action === 'register') {
      const body = await request.json();
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const existing = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const passwordHash = await hashPassword(parsed.data.password);
      let skyledgerId = generateSkyledgerId();
      for (let i = 0; i < 10; i++) {
        const taken = await db.query.users.findFirst({ where: eq(users.skyledgerId, skyledgerId) });
        if (!taken) break;
        skyledgerId = generateSkyledgerId();
      }

      const [newUser] = await db
        .insert(users)
        .values({ skyledgerId, name: parsed.data.name, email: parsed.data.email, passwordHash, department: parsed.data.department })
        .returning({ id: users.id, skyledgerId: users.skyledgerId, name: users.name, role: users.role });

      const ip = request.headers.get('x-forwarded-for') ?? undefined;
      const ua = request.headers.get('user-agent') ?? undefined;
      const { token, expiresAt } = await createSession(newUser.id, ip, ua);

      const res = NextResponse.json({ success: true, user: newUser }, { status: 201 });
      res.cookies.set('terminal_session', token, sessionCookieOptions(expiresAt));
      return res;
    }

    if (action === 'logout') {
      const token = request.cookies.get('terminal_session')?.value;
      if (token) await deleteSession(token);
      const res = NextResponse.json({ success: true });
      res.cookies.delete('terminal_session');
      return res;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[/api/auth]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
