import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, airports } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and, or, ilike, gte, lte, count, sum, inArray, not, SQL } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';
  const airport = searchParams.get('airport') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const format = searchParams.get('format'); // 'csv' or 'pdf'

  // Log export activity if format is specified
  if (format === 'csv' || format === 'pdf') {
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'export',
      entityType: 'report',
      details: {
        format,
        search,
        airport,
        dateFrom,
        dateTo,
      },
      request,
    });
  }

  const conditions: SQL[] = [];

  // Search by AWB, Sender, Receiver (from notes field)
  if (search) {
    conditions.push(
      or(
        ilike(shipments.awbNumber, `%${search}%`),
        ilike(shipments.notes, `%${search}%`)
      )!
    );
  }

  // Filter by airport (origin or destination)
  if (airport && airport !== 'all') {
    const airportRecord = await db.query.airports.findFirst({
      where: eq(airports.iataCode, airport),
    });
    if (airportRecord) {
      conditions.push(
        or(
          eq(shipments.originAirportId, airportRecord.id),
          eq(shipments.destAirportId, airportRecord.id)
        )!
      );
    }
  }

  // Date range filter
  if (dateFrom) {
    conditions.push(gte(shipments.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(shipments.createdAt, endDate));
  }

  const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Total Shipments matching filters
  const [totalResult] = await db
    .select({ total: count() })
    .from(shipments)
    .where(baseWhere);

  // 2. In-Flight (Active: status not in 'delivered', 'closed', 'cancelled') matching filters
  const activeConditions = [
    not(inArray(shipments.status, ['delivered', 'closed', 'cancelled']))
  ];
  if (baseWhere) activeConditions.push(baseWhere);
  const [inFlightResult] = await db
    .select({ inFlight: count() })
    .from(shipments)
    .where(and(...activeConditions));

  // 3. Arrived (Completed: status in 'delivered', 'closed') matching filters
  const arrivedConditions = [
    inArray(shipments.status, ['delivered', 'closed'])
  ];
  if (baseWhere) arrivedConditions.push(baseWhere);
  const [arrivedResult] = await db
    .select({ arrived: count() })
    .from(shipments)
    .where(and(...arrivedConditions));

  // 4. Total Tonnage (Sum of weight in Kg) matching filters
  const [weightResult] = await db
    .select({ totalWeight: sum(shipments.weightKg) })
    .from(shipments)
    .where(baseWhere);

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        total: totalResult?.total || 0,
        inFlight: inFlightResult?.inFlight || 0,
        arrived: arrivedResult?.arrived || 0,
        totalWeightKg: weightResult?.totalWeight || '0',
      },
    },
  });
}
