import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { gte, count, sum } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const daysBack = Math.min(Number(searchParams.get('days') ?? 7), 90);
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const [totals] = await db
    .select({ total: count(), totalWeight: sum(shipments.weightKg) })
    .from(shipments)
    .where(gte(shipments.createdAt, since));

  const byStatus = await db
    .select({ status: shipments.status, count: count() })
    .from(shipments)
    .where(gte(shipments.createdAt, since))
    .groupBy(shipments.status);

  const byPriority = await db
    .select({ priority: shipments.priority, count: count() })
    .from(shipments)
    .where(gte(shipments.createdAt, since))
    .groupBy(shipments.priority);

  const recent = await db.query.shipments.findMany({
    with: { originAirport: true, destAirport: true, flight: true },
    where: gte(shipments.createdAt, since),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 50,
  });

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        total: totals.total,
        totalWeightKg: totals.totalWeight ?? '0',
        onTime: byStatus.find((s) => s.status === 'delivered')?.count ?? 0,
        delayed: byStatus.find((s) => s.status === 'delayed')?.count ?? 0,
      },
      byStatus,
      byPriority,
      shipments: recent,
    },
  });
}
