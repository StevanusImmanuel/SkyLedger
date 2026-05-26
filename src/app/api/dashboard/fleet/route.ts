import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, flights, airlines, airplanes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { sql, eq, desc, count, gte } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Shipments by airline
    const shipmentsByAirline = await db
      .select({
        airlineName: airlines.airlineName,
        airlineCode: airlines.airlineCode,
        shipmentCount: count(),
        totalWeight: sql<number>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`,
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .innerJoin(airlines, eq(flights.airlineId, airlines.airlineId))
      .where(gte(shipments.createdAt, weekAgo))
      .groupBy(airlines.airlineId, airlines.airlineName, airlines.airlineCode)
      .orderBy(desc(count()))
      .limit(10);

    // Airplane utilization (flights per airplane)
    const airplaneUtilization = await db
      .select({
        flightNumber: airplanes.flightNumber,
        model: airplanes.model,
        capacity: airplanes.capacity,
        airlineName: airlines.airlineName,
        flightCount: count(),
        totalShipments: sql<number>`COUNT(DISTINCT ${shipments.id})`,
      })
      .from(flights)
      .leftJoin(airplanes, eq(flights.airplaneId, airplanes.airplaneId))
      .leftJoin(airlines, eq(flights.airlineId, airlines.airlineId))
      .leftJoin(shipments, eq(shipments.flightId, flights.id))
      .where(gte(flights.createdAt, weekAgo))
      .groupBy(
        airplanes.airplaneId,
        airplanes.flightNumber,
        airplanes.model,
        airplanes.capacity,
        airlines.airlineName
      )
      .orderBy(desc(count()))
      .limit(10);

    // Fleet statistics
    const [fleetStats] = await db
      .select({
        totalAirlines: sql<number>`COUNT(DISTINCT ${airlines.airlineId})`,
        totalAirplanes: sql<number>`COUNT(DISTINCT ${airplanes.airplaneId})`,
        totalFlights: sql<number>`COUNT(DISTINCT ${flights.id})`,
      })
      .from(flights)
      .leftJoin(airlines, eq(flights.airlineId, airlines.airlineId))
      .leftJoin(airplanes, eq(flights.airplaneId, airplanes.airplaneId));

    return NextResponse.json({
      success: true,
      data: {
        shipmentsByAirline: shipmentsByAirline.map(a => ({
          name: a.airlineCode,
          fullName: a.airlineName,
          shipments: a.shipmentCount,
          weight: (Number(a.totalWeight) / 1000).toFixed(1),
        })),
        airplaneUtilization: airplaneUtilization.map(a => ({
          flightNumber: a.flightNumber || 'N/A',
          model: a.model || 'N/A',
          capacity: a.capacity || 0,
          airline: a.airlineName || 'N/A',
          flights: a.flightCount,
          shipments: Number(a.totalShipments),
          utilizationRate: a.capacity ? ((Number(a.totalShipments) / a.capacity) * 100).toFixed(1) : '0',
        })),
        fleetStats: {
          totalAirlines: Number(fleetStats?.totalAirlines || 0),
          totalAirplanes: Number(fleetStats?.totalAirplanes || 0),
          totalFlights: Number(fleetStats?.totalFlights || 0),
        },
      },
    });
  } catch (err) {
    console.error('[GET /api/dashboard/fleet]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
