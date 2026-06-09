import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { registerSchema } from '@/lib/validations/auth';
import { and, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { logActivity } from '@/lib/activity-logger';

type AuthResult =
  | { user: Awaited<ReturnType<typeof getSessionUser>>; response?: never }
  | { user?: never; response: NextResponse };

function logDatabaseConnectionError(context: string, error: unknown) {
  console.error(context, {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : 'Unknown database error',
  });
}

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

async function getAuthResult(request: NextRequest, context: string): Promise<AuthResult> {
  try {
    return { user: await getAuthUser(request) };
  } catch (error) {
    logDatabaseConnectionError(`${context} session lookup failed`, error);
    return {
      response: NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      ),
    };
  }
}

const roleSchema = z.enum(['admin', 'operator', 'viewer']);

const createUserSchema = registerSchema.extend({
  role: roleSchema,
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .optional()
    .or(z.literal('')),
  role: roleSchema.optional(),
  department: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

function generateSkyledgerId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SL-${random}${Date.now().toString().slice(-2)}`;
}

async function generateUniqueSkyledgerId(): Promise<string> {
  let skyledgerId = generateSkyledgerId();

  for (let i = 0; i < 10; i++) {
    const taken = await db.query.users.findFirst({
      where: eq(users.skyledgerId, skyledgerId),
    });
    if (!taken) return skyledgerId;
    skyledgerId = generateSkyledgerId();
  }

  return skyledgerId;
}

async function activeAdminCountExcluding(userId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.isActive, true), ne(users.id, userId)));

  return result.value;
}

function safeUserColumns() {
  return {
    id: users.id,
    skyledgerId: users.skyledgerId,
    name: users.name,
    email: users.email,
    role: users.role,
    department: users.department,
    isActive: users.isActive,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  };
}

// GET /api/users         — list all users (admin only)
// GET /api/users?me=true — return current user profile
export async function GET(request: NextRequest) {
  const auth = await getAuthResult(request, '[GET /api/users]');
  if (auth.response) return auth.response;

  const user = auth.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isMe = request.nextUrl.searchParams.get('me') === 'true';

  if (isMe) {
    const { passwordHash, ...safe } = user;
    void passwordHash;
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

// POST /api/users — create user (admin only)
export async function POST(request: NextRequest) {
  const auth = await getAuthResult(request, '[POST /api/users]');
  if (auth.response) return auth.response;

  const user = auth.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const skyledgerId = await generateUniqueSkyledgerId();

    const [created] = await db
      .insert(users)
      .values({
        skyledgerId,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim(),
        passwordHash,
        role: parsed.data.role,
        department: parsed.data.department?.trim() || null,
      })
      .returning(safeUserColumns());

    // Log user creation activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'create',
      entityType: 'user',
      entityId: created.id,
      details: {
        createdUserName: created.name,
        createdUserEmail: created.email,
        createdUserRole: created.role,
      },
      request,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users — update own profile (name, department)
// PATCH /api/users?id=:id — update user (admin only)
export async function PATCH(request: NextRequest) {
  const auth = await getAuthResult(request, '[PATCH /api/users]');
  if (auth.response) return auth.response;

  const user = auth.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const targetId = request.nextUrl.searchParams.get('id');

    if (targetId) {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetId),
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const parsed = updateUserSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const updates: Record<string, unknown> = {};

      if (typeof parsed.data.name === 'string') updates.name = parsed.data.name.trim();
      if (typeof parsed.data.email === 'string') {
        const nextEmail = parsed.data.email.trim();
        if (nextEmail !== targetUser.email) {
          const duplicate = await db.query.users.findFirst({
            where: eq(users.email, nextEmail),
          });

          if (duplicate) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
          }
        }
        updates.email = nextEmail;
      }
      if (typeof parsed.data.department === 'string') updates.department = parsed.data.department.trim() || null;
      if (parsed.data.department === null) updates.department = null;
      if (parsed.data.role) updates.role = parsed.data.role;
      if (typeof parsed.data.isActive === 'boolean') updates.isActive = parsed.data.isActive;
      if (parsed.data.password) updates.passwordHash = await hashPassword(parsed.data.password);

      const wouldDisableSelf = targetId === user.id && parsed.data.isActive === false;
      const wouldRemoveOwnAdmin = targetId === user.id && parsed.data.role && parsed.data.role !== 'admin';

      if (wouldDisableSelf || wouldRemoveOwnAdmin) {
        return NextResponse.json({ error: 'You cannot remove your own admin access' }, { status: 400 });
      }

      const wouldRemoveTargetAdmin =
        targetUser.role === 'admin' &&
        targetUser.isActive &&
        (parsed.data.role && parsed.data.role !== 'admin' || parsed.data.isActive === false);

      if (wouldRemoveTargetAdmin) {
        const remainingAdmins = await activeAdminCountExcluding(targetId);
        if (remainingAdmins === 0) {
          return NextResponse.json({ error: 'At least one active admin must remain' }, { status: 400 });
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
      }

      const [updated] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, targetId))
        .returning(safeUserColumns());

      // Log user update activity
      await logActivity({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'update',
        entityType: 'user',
        entityId: targetId,
        details: {
          updatedUserName: targetUser.name,
          updatedFields: Object.keys(updates),
        },
        request,
      });

      return NextResponse.json({ success: true, data: updated });
    }

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

// DELETE /api/users?id=:id — deactivate user (admin only, soft delete)
// DELETE /api/users?id=:id&permanent=true — permanently delete user (admin only)
export async function DELETE(request: NextRequest) {
  const auth = await getAuthResult(request, '[DELETE /api/users]');
  if (auth.response) return auth.response;

  const user = auth.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const targetId = request.nextUrl.searchParams.get('id');
  const isPermanent = request.nextUrl.searchParams.get('permanent') === 'true';

  if (!targetId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

  if (targetId === user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'admin' && targetUser.isActive) {
      const remainingAdmins = await activeAdminCountExcluding(targetId);
      if (remainingAdmins === 0) {
        return NextResponse.json({ error: 'At least one active admin must remain' }, { status: 400 });
      }
    }

    if (isPermanent) {
      // Permanent delete
      await db.delete(users).where(eq(users.id, targetId));

      // Log user deletion activity
      await logActivity({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'delete',
        entityType: 'user',
        entityId: targetId,
        details: {
          deletedUserName: targetUser.name,
          deletedUserEmail: targetUser.email,
          permanent: true,
        },
        request,
      });

      return NextResponse.json({ success: true, message: 'User permanently deleted' });
    } else {
      // Soft delete (deactivate)
      const [updated] = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, targetId))
        .returning(safeUserColumns());

      // Log user deactivation activity
      await logActivity({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'update',
        entityType: 'user',
        entityId: targetId,
        details: {
          deactivatedUserName: targetUser.name,
          action: 'deactivated',
        },
        request,
      });

      return NextResponse.json({ success: true, data: updated, message: 'User deactivated' });
    }
  } catch (error) {
    console.error('[DELETE /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
