import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activityLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { desc, and, gte, lte, eq, or, ilike } from 'drizzle-orm';

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const search = searchParams.get('search');

    const conditions = [];

    if (startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(activityLogs.createdAt, end));
    }

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    if (entityType) {
      conditions.push(eq(activityLogs.entityType, entityType));
    }

    if (search) {
      conditions.push(
        or(
          ilike(activityLogs.userName, `%${search}%`),
          ilike(activityLogs.details, `%${search}%`),
          ilike(activityLogs.entityId, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalResult] = await Promise.all([
      db
        .select()
        .from(activityLogs)
        .where(whereClause)
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: activityLogs.id })
        .from(activityLogs)
        .where(whereClause),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      total: totalResult.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
