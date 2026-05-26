import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, flights, airports, airlines, airplanes } from '@/lib/db/schema';
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
    // Get duration parameter (default: week)
    const { searchParams } = new URL(request.url);
    const duration = searchParams.get('duration') || 'week';

    // Calculate date range based on duration
    const now = new Date();
    let startDate: Date;
    let daysCount: number;

    switch (duration) {
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        daysCount = 30;
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        daysCount = 12; // Show 12 months
        break;
      case 'week':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        daysCount = 7;
        break;
    }

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

    // Capacity utilization by day/month/year based on duration
    const capacityDataRaw = await db
      .select({
        day: sql<string>`TO_CHAR(${shipments.createdAt}, 'DY')`,
        date: sql<string>`DATE(${shipments.createdAt})`,
        inbound: sql<number>`COALESCE(SUM(CASE WHEN ${shipments.status} = 'in_transit' THEN CAST(${shipments.weightKg} AS NUMERIC) ELSE 0 END), 0)`,
        outbound: sql<number>`COALESCE(SUM(CASE WHEN ${shipments.status} = 'delivered' THEN CAST(${shipments.weightKg} AS NUMERIC) ELSE 0 END), 0)`,
      })
      .from(shipments)
      .where(gte(shipments.createdAt, startDate))
      .groupBy(sql`DATE(${shipments.createdAt})`, sql`TO_CHAR(${shipments.createdAt}, 'DY')`)
      .orderBy(sql`DATE(${shipments.createdAt})`);

    // Format capacity data based on duration
    let capacityData;
    if (duration === 'week') {
      const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      capacityData = daysOfWeek.map(day => {
        const found = capacityDataRaw.find(d => d.day.toUpperCase() === day);
        return {
          day,
          inbound: found ? Math.round(Number(found.inbound) / 1000) : 0,
          outbound: found ? Math.round(Number(found.outbound) / 1000) : 0,
        };
      });
    } else if (duration === 'month') {
      // Group by week for month view
      capacityData = capacityDataRaw.map(d => ({
        day: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inbound: Math.round(Number(d.inbound) / 1000),
        outbound: Math.round(Number(d.outbound) / 1000),
      }));
    } else {
      // Group by month for year view
      capacityData = capacityDataRaw.map(d => ({
        day: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
        inbound: Math.round(Number(d.inbound) / 1000),
        outbound: Math.round(Number(d.outbound) / 1000),
      }));
    }

    // SLA data for pie chart - now showing actual shipment statuses
    const slaData = [
      { name: 'Delivered', value: deliveredCount, color: '#10b981' },
      { name: 'In Transit', value: activeCount, color: '#0ea5e9' },
      { name: 'Delayed', value: delayedCount, color: '#ef4444' },
    ];

    // Top operational routes (by cargo weight) with airline info
    const topRoutesRaw = await db
      .select({
        originCode: airports.iataCode,
        originName: airports.name,
        destCode: sql<string>`dest_airport.iata_code`,
        destName: sql<string>`dest_airport.name`,
        airlineCode: airlines.airlineCode,
        flightNumber: airplanes.flightNumber,
        totalWeight: sql<number>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`,
        shipmentCount: count(),
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .leftJoin(airlines, eq(flights.airlineId, airlines.airlineId))
      .leftJoin(airplanes, eq(flights.airplaneId, airplanes.airplaneId))
      .innerJoin(airports, eq(shipments.originAirportId, airports.id))
      .innerJoin(sql`airports AS dest_airport`, sql`${shipments.destAirportId} = dest_airport.id`)
      .where(gte(shipments.createdAt, startDate))
      .groupBy(
        airports.iataCode,
        airports.name,
        sql`dest_airport.iata_code`,
        sql`dest_airport.name`,
        airlines.airlineCode,
        airplanes.flightNumber
      )
      .orderBy(desc(sql`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`))
      .limit(5);

    // Recent cargo flights with status including airline and airplane info
    const cargoFlights = await db.query.shipments.findMany({
      with: {
        originAirport: true,
        destAirport: true,
        flight: {
          with: {
            airline: true,
            airplane: true,
          },
        },
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
        topRoutes: topRoutesRaw.map((r, idx) => ({
          id: `A${idx + 1}`,
          sector: `${r.originCode} → ${r.destCode}`,
          desc: `${r.originName} to ${r.destName}`,
          flightId: r.flightNumber || r.airlineCode || 'N/A',
          weight: `${(Number(r.totalWeight) / 1000).toFixed(1)} MT`,
          shipmentCount: r.shipmentCount,
        })),
        cargoFlights: cargoFlights.map(f => ({
          awb: f.awbNumber,
          origin: f.originAirport?.iataCode || 'N/A',
          dest: f.destAirport?.iataCode || 'N/A',
          flight: f.flight?.airplane?.flightNumber || 'N/A',
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
