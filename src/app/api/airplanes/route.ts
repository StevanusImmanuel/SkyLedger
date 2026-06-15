import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airplanes, airlines, flights, shipments } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth/session';
import { logActivity } from '@/lib/activity-logger';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = request.cookies.get('terminal_session')?.value;
    const user = token ? await getSessionUser(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const airlineId = searchParams.get('airlineId');

    const activeWeightSubquery = db
      .select({
        airplaneId: flights.airplaneId,
        totalWeight: sql<number>`SUM(CAST(${shipments.weightKg} AS NUMERIC))`.as('total_weight'),
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .where(
        and(
          inArray(flights.status, ['scheduled', 'departed']),
          inArray(shipments.status, ['pending', 'processing', 'in_transit'])
        )
      )
      .groupBy(flights.airplaneId)
      .as('aw');

    const whereConditions = airlineId
      ? eq(airplanes.airlineId, parseInt(airlineId))
      : undefined;

    const allAirplanes = await db
      .select({
        airplaneId: airplanes.airplaneId,
        flightNumber: airplanes.flightNumber,
        model: airplanes.model,
        capacity: airplanes.capacity,
        maxWeightKg: airplanes.maxWeightKg,
        maxVolumeM3: airplanes.maxVolumeM3,
        isActive: airplanes.isActive,
        airlineId: airplanes.airlineId,
        airlineName: airlines.airlineName,
        airlineCode: airlines.airlineCode,
        utilizedWeight: sql<number>`COALESCE(${activeWeightSubquery.totalWeight}, 0)`,
      })
      .from(airplanes)
      .leftJoin(airlines, eq(airplanes.airlineId, airlines.airlineId))
      .leftJoin(activeWeightSubquery, eq(airplanes.airplaneId, activeWeightSubquery.airplaneId))
      .where(whereConditions)
      .orderBy(airplanes.flightNumber);

    return NextResponse.json({
      success: true,
      data: allAirplanes,
    });
  } catch (error) {
    console.error('Error fetching airplanes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airplanes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'operator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { model, capacity, maxWeightKg, maxVolumeM3, airlineId } = body;

    // Airline is required and must exist — the flight number is derived from its code.
    if (!airlineId) {
      return NextResponse.json({ error: 'Please select an airline' }, { status: 400 });
    }
    const airline = await db.query.airlines.findFirst({
      where: eq(airlines.airlineId, Number(airlineId)),
    });
    if (!airline) {
      return NextResponse.json({ error: 'Selected airline does not exist' }, { status: 400 });
    }

    // Per-field validation
    if (!model?.trim()) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }
    if (capacity === undefined || capacity === null || capacity === '') {
      return NextResponse.json({ error: 'Passenger capacity is required' }, { status: 400 });
    }
    if (maxWeightKg === undefined || maxWeightKg === null || maxWeightKg === '') {
      return NextResponse.json({ error: 'Cargo weight capacity is required' }, { status: 400 });
    }

    const capacityValue = Number(capacity);
    const maxWeightValue = Number(maxWeightKg);
    const maxVolumeValue = maxVolumeM3 !== undefined && maxVolumeM3 !== null && maxVolumeM3 !== '' ? Number(maxVolumeM3) : null;

    if (!Number.isInteger(capacityValue) || capacityValue <= 0) {
      return NextResponse.json({ error: 'Passenger/General capacity must be a positive integer' }, { status: 400 });
    }
    if (isNaN(maxWeightValue) || maxWeightValue <= 0) {
      return NextResponse.json({ error: 'Cargo weight capacity must be a positive number' }, { status: 400 });
    }
    if (maxVolumeValue !== null && (isNaN(maxVolumeValue) || maxVolumeValue <= 0)) {
      return NextResponse.json({ error: 'Cargo volume capacity must be a positive number' }, { status: 400 });
    }

    // Auto-generate a unique flight number from the airline code: e.g. "BA-1391".
    // Derived from the current max numeric suffix so the identifier stays sequential and
    // is never supplied (or spoofed) by the client.
    // Auto-generate a unique flight number from the airline code: e.g. "BA-101".
    // Numbering is per-airline: derived from the highest existing suffix among that
    // airline's own aircraft, so each airline has its own sequence. The client never
    // supplies (or spoofs) the identifier.
    const [{ maxNum }] = await db
      .select({
        maxNum: sql<number>`COALESCE(MAX(NULLIF(regexp_replace(${airplanes.flightNumber}, '\\D', '', 'g'), '')::int), 100)`,
      })
      .from(airplanes)
      .where(eq(airplanes.airlineId, Number(airlineId)));

    let nextNum = Number(maxNum);
    let flightNumber = '';
    let isUnique = false;
    for (let i = 0; i < 10; i++) {
      nextNum += 1;
      flightNumber = `${airline.airlineCode}-${nextNum}`;
      const existing = await db.query.airplanes.findFirst({
        where: eq(airplanes.flightNumber, flightNumber),
      });
      if (!existing) {
        isUnique = true;
        break;
      }
    }
    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate a unique flight number. Please try again.' }, { status: 409 });
    }

    const [newAirplane] = await db
      .insert(airplanes)
      .values({
        flightNumber,
        model: model.trim(),
        capacity: capacityValue,
        maxWeightKg: String(maxWeightValue),
        maxVolumeM3: maxVolumeValue ? String(maxVolumeValue) : null,
        airlineId: Number(airlineId),
      })
      .returning();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'create',
      entityType: 'airplane',
      entityId: String(newAirplane.airplaneId),
      details: { flightNumber: newAirplane.flightNumber, model: newAirplane.model },
      request,
    });

    return NextResponse.json({ success: true, data: newAirplane }, { status: 201 });
  } catch (error) {
    console.error('Error creating airplane:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
