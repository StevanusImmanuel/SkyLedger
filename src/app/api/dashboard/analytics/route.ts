import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, flights, airports } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { sql, eq, and, gte, desc, count } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Get date range for weekly data
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Stats: Total cargo tonnage (sum of all shipments weight)
    const [totalCargoResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)` })
      .from(shipments);

    const totalCargoTonnage = Number(totalCargoResult.total) / 1000; // Convert kg to MT

    // Stats: Count shipments by status
    const statusCounts = await db
      .select({
        status: shipments.status,
        count: count(),
      })
      .from(shipments)
      .groupBy(shipments.status);

    const activeCount = statusCounts.find(s => s.status === 'in_transit')?.count || 0;
    const delayedCount = statusCounts.find(s => s.status === 'delayed')?.count || 0;
    const deliveredCount = statusCounts.find(s => s.status === 'delivered')?.count || 0;
    const totalShipments = statusCounts.reduce((sum, s) => sum + s.count, 0);

    // SLA completion percentage (delivered / total)
    const slaCompletion = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0;

    // Capacity utilization by day (last 7 days) - simplified to avoid empty data
    const capacityDataRaw = await db
      .select({
        day: sql<string>`TO_CHAR(${shipments.createdAt}, 'DY')`,
        date: sql<string>`DATE(${shipments.createdAt})`,
        inbound: sql<number>`COALESCE(SUM(CASE WHEN ${shipments.status} = 'in_transit' THEN CAST(${shipments.weightKg} AS NUMERIC) ELSE 0 END), 0)`,
        outbound: sql<number>`COALESCE(SUM(CASE WHEN ${shipments.status} = 'delivered' THEN CAST(${shipments.weightKg} AS NUMERIC) ELSE 0 END), 0)`,
      })
      .from(shipments)
      .where(gte(shipments.createdAt, weekAgo))
      .groupBy(sql`DATE(${shipments.createdAt})`, sql`TO_CHAR(${shipments.createdAt}, 'DY')`)
      .orderBy(sql`DATE(${shipments.createdAt})`);

    // Fill in missing days with zeros
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const capacityData = daysOfWeek.map(day => {
      const found = capacityDataRaw.find(d => d.day.toUpperCase() === day);
      return {
        day,
        inbound: found ? Math.round(Number(found.inbound) / 1000) : 0,
        outbound: found ? Math.round(Number(found.outbound) / 1000) : 0,
      };
    });

    // SLA data for pie chart
    const slaData = [
      { name: 'Met (SLA-1)', value: deliveredCount, color: '#1a2d5a' },
      { name: 'Pending Review', value: activeCount, color: '#ef4444' },
      { name: 'At Risk', value: delayedCount, color: '#e2e8f0' },
    ];

    // Top operational routes (by cargo weight)
    const topRoutes = await db
      .select({
        originCode: airports.iataCode,
        originName: airports.name,
        destCode: sql<string>`dest_airport.iata_code`,
        destName: sql<string>`dest_airport.name`,
        flightId: flights.flightId,
        totalWeight: sql<number>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`,
        shipmentCount: count(),
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .innerJoin(airports, eq(shipments.originAirportId, airports.id))
      .innerJoin(sql`airports AS dest_airport`, sql`${shipments.destAirportId} = dest_airport.id`)
      .where(gte(shipments.createdAt, weekAgo))
      .groupBy(
        airports.iataCode,
        airports.name,
        sql`dest_airport.iata_code`,
        sql`dest_airport.name`,
        flights.flightId
      )
      .orderBy(desc(sql`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`))
      .limit(5);

    // Recent cargo flights with status
    const cargoFlights = await db.query.shipments.findMany({
      with: {
        originAirport: true,
        destAirport: true,
        flight: true,
      },
      orderBy: [desc(shipments.createdAt)],
      limit: 6,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCargoTonnage: totalCargoTonnage.toFixed(1),
          activeShipments: activeCount,
          delayedShipments: delayedCount,
          slaCompletion: slaCompletion.toFixed(1),
          totalShipments,
        },
        capacityData,
        slaData,
        topRoutes: topRoutes.map((r, idx) => ({
          id: `A${idx + 1}`,
          sector: `${r.originCode} → ${r.destCode}`,
          desc: `${r.originName} to ${r.destName}`,
          flightId: r.flightId,
          weight: `${(Number(r.totalWeight) / 1000).toFixed(1)} MT`,
          shipmentCount: r.shipmentCount,
        })),
        cargoFlights: cargoFlights.map(f => ({
          awb: f.awbNumber,
          origin: f.originAirport?.iataCode || 'N/A',
          dest: f.destAirport?.iataCode || 'N/A',
          flight: f.flight?.flightId || 'N/A',
          status: f.status,
          weight: `${Number(f.weightKg).toFixed(0)} kg`,
          timestamp: f.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error('[GET /api/dashboard/analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
