import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

// GET /api/users         — list all users (admin only)
// GET /api/users?me=true — return current user profile
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isMe = request.nextUrl.searchParams.get('me') === 'true';

  if (isMe) {
    const { passwordHash: _, ...safe } = user;
    return NextResponse.json({ success: true, data: safe });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allUsers = await db.query.users.findMany({
    columns: { passwordHash: false },
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });

  return NextResponse.json({ success: true, data: allUsers });
}

// PATCH /api/users — update own profile (name, department)
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    if (typeof body.name === 'string') allowed.name = body.name.trim();
    if (typeof body.department === 'string') allowed.department = body.department.trim();

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set({ ...allowed, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, name: users.name, department: users.department });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
