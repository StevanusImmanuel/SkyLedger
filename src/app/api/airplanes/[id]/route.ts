import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airplanes, airlines, flights, shipments } from '@/lib/db/schema';
import { eq, and, ne, inArray, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth/session';
import { logActivity } from '@/lib/activity-logger';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const airplaneId = parseInt(id);
    if (isNaN(airplaneId)) {
      return NextResponse.json({ error: 'Invalid airplane ID' }, { status: 400 });
    }

    // Dynamic active shipments load query
    const activeWeightSubquery = db
      .select({
        airplaneId: flights.airplaneId,
        totalWeight: sql<number>`SUM(CAST(${shipments.weightKg} AS NUMERIC))`.as('total_weight'),
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .where(
        and(
          eq(flights.airplaneId, airplaneId),
          inArray(flights.status, ['scheduled', 'departed']),
          inArray(shipments.status, ['pending', 'processing', 'in_transit'])
        )
      )
      .groupBy(flights.airplaneId)
      .as('aw');

    const [airplane] = await db
      .select({
        airplaneId: airplanes.airplaneId,
        flightNumber: airplanes.flightNumber,
        model: airplanes.model,
        capacity: airplanes.capacity,
        maxWeightKg: airplanes.maxWeightKg,
        maxVolumeM3: airplanes.maxVolumeM3,
        airlineId: airplanes.airlineId,
        airlineName: airlines.airlineName,
        airlineCode: airlines.airlineCode,
        utilizedWeight: sql<number>`COALESCE(${activeWeightSubquery.totalWeight}, 0)`,
      })
      .from(airplanes)
      .leftJoin(airlines, eq(airplanes.airlineId, airlines.airlineId))
      .leftJoin(activeWeightSubquery, eq(airplanes.airplaneId, activeWeightSubquery.airplaneId))
      .where(eq(airplanes.airplaneId, airplaneId));

    if (!airplane) {
      return NextResponse.json({ error: 'Airplane not found' }, { status: 404 });
    }

    // Get flights and shipments assigned to this airplane
    const airplaneFlights = await db.query.flights.findMany({
      where: eq(flights.airplaneId, airplaneId),
      with: {
        originAirport: true,
        destAirport: true,
      },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });

    const activeShipments = await db
      .select({
        id: shipments.id,
        awbNumber: shipments.awbNumber,
        weightKg: shipments.weightKg,
        status: shipments.status,
        deliveryStatus: shipments.deliveryStatus,
        productType: shipments.productType,
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .where(
        and(
          eq(flights.airplaneId, airplaneId),
          inArray(shipments.status, ['pending', 'processing', 'in_transit', 'delivered', 'closed'])
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        ...airplane,
        flights: airplaneFlights,
        assignedShipments: activeShipments,
      },
    });
  } catch (error) {
    console.error('Error fetching airplane details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'operator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const airplaneId = parseInt(id);
    if (isNaN(airplaneId)) {
      return NextResponse.json({ error: 'Invalid airplane ID' }, { status: 400 });
    }

    const body = await request.json();
    const { flightNumber, model, capacity, maxWeightKg, maxVolumeM3, airlineId } = body;

    const existingAirplane = await db.query.airplanes.findFirst({
      where: eq(airplanes.airplaneId, airplaneId),
    });

    if (!existingAirplane) {
      return NextResponse.json({ error: 'Airplane not found' }, { status: 404 });
    }

    // Validate fields if provided
    const updateData: Record<string, any> = {};

    if (flightNumber !== undefined) {
      if (!flightNumber.trim()) {
        return NextResponse.json({ error: 'Flight identifier cannot be empty' }, { status: 400 });
      }
      // Check duplicate
      const duplicate = await db.query.airplanes.findFirst({
        where: and(
          eq(airplanes.flightNumber, flightNumber.trim()),
          ne(airplanes.airplaneId, airplaneId)
        ),
      });
      if (duplicate) {
        return NextResponse.json({ error: `Flight identifier '${flightNumber}' already exists` }, { status: 409 });
      }
      updateData.flightNumber = flightNumber.trim();
    }

    if (model !== undefined) {
      if (!model.trim()) {
        return NextResponse.json({ error: 'Model name cannot be empty' }, { status: 400 });
      }
      updateData.model = model.trim();
    }

    if (capacity !== undefined) {
      const capacityValue = Number(capacity);
      if (isNaN(capacityValue) || capacityValue <= 0) {
        return NextResponse.json({ error: 'General capacity must be a positive integer' }, { status: 400 });
      }
      updateData.capacity = capacityValue;
    }

    if (maxVolumeM3 !== undefined) {
      const maxVolumeValue = maxVolumeM3 ? Number(maxVolumeM3) : null;
      if (maxVolumeValue !== null && (isNaN(maxVolumeValue) || maxVolumeValue <= 0)) {
        return NextResponse.json({ error: 'Cargo volume capacity must be a positive number' }, { status: 400 });
      }
      updateData.maxVolumeM3 = maxVolumeValue ? String(maxVolumeValue) : null;
    }

    if (airlineId !== undefined) {
      updateData.airlineId = Number(airlineId);
    }

    if (maxWeightKg !== undefined) {
      const maxWeightValue = Number(maxWeightKg);
      if (isNaN(maxWeightValue) || maxWeightValue <= 0) {
        return NextResponse.json({ error: 'Cargo weight capacity must be a positive number' }, { status: 400 });
      }

      // Calculate current assigned shipment weight
      const [{ value: currentLoad }] = await db
        .select({ value: sql<number>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)` })
        .from(shipments)
        .innerJoin(flights, eq(shipments.flightId, flights.id))
        .where(
          and(
            eq(flights.airplaneId, airplaneId),
            inArray(flights.status, ['scheduled', 'departed']),
            inArray(shipments.status, ['pending', 'processing', 'in_transit'])
          )
        );

      const existingWeight = Number(currentLoad);
      if (maxWeightValue < existingWeight) {
        return NextResponse.json({
          error: `Capacity cannot be reduced below the existing assigned cargo load. Current load: ${existingWeight.toFixed(1)}kg, requested capacity: ${maxWeightValue}kg`
        }, { status: 400 });
      }

      updateData.maxWeightKg = String(maxWeightValue);
    }

    const [updated] = await db
      .update(airplanes)
      .set(updateData)
      .where(eq(airplanes.airplaneId, airplaneId))
      .returning();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'update',
      entityType: 'airplane',
      entityId: String(airplaneId),
      details: { updatedFields: Object.keys(updateData) },
      request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating airplane:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'operator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const airplaneId = parseInt(id);
    if (isNaN(airplaneId)) {
      return NextResponse.json({ error: 'Invalid airplane ID' }, { status: 400 });
    }

    const airplane = await db.query.airplanes.findFirst({
      where: eq(airplanes.airplaneId, airplaneId),
    });

    if (!airplane) {
      return NextResponse.json({ error: 'Airplane not found' }, { status: 404 });
    }

    // Check if there are active shipments assigned
    const activeShipments = await db
      .select({ id: shipments.id, awb: shipments.awbNumber })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .where(
        and(
          eq(flights.airplaneId, airplaneId),
          inArray(shipments.status, ['pending', 'processing', 'in_transit'])
        )
      );

    if (activeShipments.length > 0) {
      return NextResponse.json({
        error: `Cannot delete airplane ${airplane.flightNumber} because it has ${activeShipments.length} active shipments assigned. Reassign or cancel them first.`
      }, { status: 400 });
    }

    // Check if there are scheduled or active flights
    const activeFlights = await db
      .select({ id: flights.id })
      .from(flights)
      .where(
        and(
          eq(flights.airplaneId, airplaneId),
          inArray(flights.status, ['scheduled', 'departed', 'diverted'])
        )
      );

    if (activeFlights.length > 0) {
      return NextResponse.json({
        error: `Cannot delete airplane ${airplane.flightNumber} because it has active or future flights scheduled. Cancel or reschedule these flights first.`
      }, { status: 400 });
    }

    // If safe, delete the airplane
    await db.delete(airplanes).where(eq(airplanes.airplaneId, airplaneId));

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'delete',
      entityType: 'airplane',
      entityId: String(airplaneId),
      details: { flightNumber: airplane.flightNumber, model: airplane.model },
      request,
    });

    return NextResponse.json({ success: true, message: 'Airplane deleted successfully' });
  } catch (error) {
    console.error('Error deleting airplane:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
