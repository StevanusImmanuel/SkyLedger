import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, shipmentEvents, airports, flights, airlines, airplanes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import {
  calculateShippingFeeFromInput,
  formatShippingFee,
  isShipmentPriority,
} from '@/lib/shipments/shipping-fee';
import { eq, desc, and, or, ilike, count, gte, lte, SQL, inArray, sql, ne } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

function generateAwbNumber(airlineCode: string): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${airlineCode}-${randomNum}`;
}

function buildShipmentNotes({
  sender,
  receiver,
  telpNumber,
  originAddress,
  destinationAddress,
  deliveryType,
  shippingFee,
  weightUnit,
  shippingDate,
  notes,
}: {
  sender?: string;
  receiver?: string;
  telpNumber?: string;
  originAddress?: string;
  destinationAddress?: string;
  deliveryType?: string;
  shippingFee?: string;
  weightUnit?: string;
  shippingDate?: string;
  notes?: string;
}) {
  return [
    shippingDate && `Shipping Date: ${shippingDate}`,
    sender && `Sender: ${sender}`,
    receiver && `Receiver: ${receiver}`,
    telpNumber && `Tel: ${telpNumber}`,
    originAddress && `Origin: ${originAddress}`,
    destinationAddress && `Dest: ${destinationAddress}`,
    deliveryType && `Delivery: ${deliveryType}`,
    shippingFee && `Fee: ${shippingFee}`,
    weightUnit && `Weight Unit: ${weightUnit}`,
    notes && `Notes: ${notes}`,
  ].filter(Boolean).join(', ');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get('status') as typeof shipments.$inferSelect.status | null;
    const deliveryStatusFilter = searchParams.get('deliveryStatus');
    const search = searchParams.get('search') || '';
    const airport = searchParams.get('airport') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 1000);
    const offset = Number(searchParams.get('offset') ?? 0);

    // Log search activity if search parameter is provided
    if (search) {
      await logActivity({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'search',
        entityType: 'shipment',
        details: { searchQuery: search },
        request,
      });
    }

    const conditions: SQL[] = [];

    if (statusFilter) {
      conditions.push(eq(shipments.status, statusFilter));
    }

    if (deliveryStatusFilter) {
      if (deliveryStatusFilter === 'all_delivered') {
        conditions.push(
          inArray(shipments.deliveryStatus, [
            'delivered',
            'arrived_at_destination',
            'out_for_delivery',
            'ready_for_pickup',
          ])
        );
      } else if (deliveryStatusFilter.includes(',')) {
        const statuses = deliveryStatusFilter.split(',') as any[];
        conditions.push(inArray(shipments.deliveryStatus, statuses));
      } else {
        conditions.push(eq(shipments.deliveryStatus, deliveryStatusFilter as any));
      }
    }

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

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db.query.shipments.findMany({
        where,
        with: {
          originAirport: true,
          destAirport: true,
          flight: {
            with: {
              airline: true,
              airplane: true,
            },
          },
          createdByUser: { columns: { id: true, name: true, skyledgerId: true } },
        },
        orderBy: [desc(shipments.createdAt)],
        limit,
        offset,
      }),
      db.select({ value: count() }).from(shipments).where(where),
    ]);

    return NextResponse.json({ success: true, data: rows, total });
  } catch (error: any) {
    console.error('[GET /api/shipments]', error);
    return NextResponse.json({ error: error.message || 'Internal server error', stack: error.stack }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    const {
      airlineId,
      airplaneId,
      shippingDate,
      sender,
      receiver,
      telpNumber,
      originAddress,
      destinationAddress,
      originIata,
      destIata,
      productType,
      productWeight,
      weightUnit,
      deliveryType,
      deliveryStatus,
      notes,
    } = body;
    const priority = body.priority || 'standard';

    // Validate missing fields
    if (!airlineId || !airplaneId || !shippingDate || !sender?.trim() || !receiver?.trim() || 
        !telpNumber?.trim() || !originAddress?.trim() || !destinationAddress?.trim() || 
        !originIata?.trim() || !destIata?.trim() || !productType?.trim() || 
        productWeight === undefined || !deliveryType?.trim()) {
      return NextResponse.json({ error: 'Missing required shipment fields' }, { status: 400 });
    }

    const productWeightValue = Number(productWeight);
    if (isNaN(productWeightValue) || productWeightValue <= 0) {
      return NextResponse.json({ error: 'Product weight must be a positive number' }, { status: 400 });
    }

    const shippingFee = calculateShippingFeeFromInput(productWeight, priority);

    if (!isShipmentPriority(priority)) {
      return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 });
    }

    if (shippingFee === null) {
      return NextResponse.json({ error: 'Product weight must be a non-negative number' }, { status: 400 });
    }

    // Get airline code for AWB generation
    const airline = await db.query.airlines.findFirst({
      where: eq(airlines.airlineId, airlineId),
    });

    if (!airline) {
      return NextResponse.json({ error: 'Invalid airline selection' }, { status: 400 });
    }

    // Validate aircraft exists and is active (before any flight is created)
    const airplane = await db.query.airplanes.findFirst({
      where: eq(airplanes.airplaneId, airplaneId),
    });

    if (!airplane) {
      return NextResponse.json({ error: 'Selected aircraft does not exist' }, { status: 400 });
    }

    if (!airplane.isActive) {
      return NextResponse.json({ error: `Aircraft ${airplane.flightNumber} is not active and cannot be assigned` }, { status: 400 });
    }

    // Get airports
    const [originAirport, destAirport] = await Promise.all([
      db.query.airports.findFirst({ where: eq(airports.iataCode, originIata) }),
      db.query.airports.findFirst({ where: eq(airports.iataCode, destIata) }),
    ]);

    if (!originAirport) {
      return NextResponse.json({ error: `Origin airport with code ${originIata} not found` }, { status: 400 });
    }

    if (!destAirport) {
      return NextResponse.json({ error: `Destination airport with code ${destIata} not found` }, { status: 400 });
    }

    if (originIata.toUpperCase() === destIata.toUpperCase()) {
      return NextResponse.json({ error: 'Destination airport must be different from origin airport' }, { status: 400 });
    }

    // Validate coordinates
    const latOrigin = Number(originAirport.latitude);
    const lonOrigin = Number(originAirport.longitude);
    const latDest = Number(destAirport.latitude);
    const lonDest = Number(destAirport.longitude);

    if (isNaN(latOrigin) || isNaN(lonOrigin) || latOrigin < -90 || latOrigin > 90 || lonOrigin < -180 || lonOrigin > 180) {
      return NextResponse.json({ error: `Origin airport (${originIata}) has invalid coordinates` }, { status: 400 });
    }

    if (isNaN(latDest) || isNaN(lonDest) || latDest < -90 || latDest > 90 || lonDest < -180 || lonDest > 180) {
      return NextResponse.json({ error: `Destination airport (${destIata}) has invalid coordinates` }, { status: 400 });
    }

    // Find or create a flight for the airplane
    let availableFlight = await db.query.flights.findFirst({
      where: and(
        eq(flights.airplaneId, airplaneId),
        eq(flights.status, 'scheduled')
      ),
    });

    // If no scheduled flight exists, create one
    if (!availableFlight) {
      const [newFlight] = await db
        .insert(flights)
        .values({
          airlineId: airlineId,
          airplaneId: airplaneId,
          originAirportId: originAirport.id,
          destAirportId: destAirport.id,
          departureTime: shippingDate ? new Date(shippingDate) : new Date(),
          arrivalTime: shippingDate ? new Date(new Date(shippingDate).getTime() + 3 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'scheduled',
        })
        .returning();
      availableFlight = newFlight;
    }

    // Capacity validation
    if (airplane?.maxWeightKg) {
      const maxWeight = Number(airplane.maxWeightKg);
      const [{ value: currentLoad }] = await db
        .select({ value: sql<string>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)` })
        .from(shipments)
        .where(
          and(
            eq(shipments.flightId, availableFlight!.id),
            inArray(shipments.status, ['pending', 'processing', 'in_transit'])
          )
        );

      const existingWeight = Number(currentLoad);
      if ((existingWeight + productWeightValue) > maxWeight) {
        // Find alternative airplanes from the same airline with sufficient capacity
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

        const allAlternativePlanes = await db
          .select({
            airplaneId: airplanes.airplaneId,
            flightNumber: airplanes.flightNumber,
            model: airplanes.model,
            maxWeightKg: airplanes.maxWeightKg,
            utilizedWeight: sql<number>`COALESCE(${activeWeightSubquery.totalWeight}, 0)`,
          })
          .from(airplanes)
          .leftJoin(activeWeightSubquery, eq(airplanes.airplaneId, activeWeightSubquery.airplaneId))
          .where(
            and(
              eq(airplanes.airlineId, airlineId),
              ne(airplanes.airplaneId, airplaneId),
              eq(airplanes.isActive, true)
            )
          );

        // Map and filter alternatives that can safely accommodate the shipment
        const recommendations = allAlternativePlanes
          .map(plane => {
            const limitWeight = Number(plane.maxWeightKg || 0);
            const utilized = Number(plane.utilizedWeight);
            const remaining = limitWeight - utilized;
            const utilizationPct = limitWeight > 0 ? (utilized / limitWeight) * 100 : 0;
            return {
              airplaneId: plane.airplaneId,
              flightNumber: plane.flightNumber,
              model: plane.model,
              maxWeightKg: plane.maxWeightKg,
              utilizedWeight: utilized,
              remainingCapacity: remaining,
              utilizationPercentage: utilizationPct,
            };
          })
          .filter(plane => plane.remainingCapacity >= productWeightValue)
          .sort((a, b) => Number(a.maxWeightKg) - Number(b.maxWeightKg)); // Best fit: smallest airplane capacity first

        return NextResponse.json({
          error: `Airplane ${airplane.flightNumber} capacity exceeded. Max: ${maxWeight}kg, current load: ${existingWeight.toFixed(1)}kg, shipment: ${productWeightValue}kg`,
          recommendations,
        }, { status: 400 });
      }
    }

    // Generate and verify AWB uniqueness (avoid duplicate tracking numbers)
    let awbNumber = '';
    let isUnique = false;
    for (let i = 0; i < 5; i++) {
      awbNumber = generateAwbNumber(airline.airlineCode);
      const existing = await db.query.shipments.findFirst({
        where: eq(shipments.awbNumber, awbNumber),
      });
      if (!existing) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate a unique Air Waybill tracking number. Please try again.' }, { status: 409 });
    }

    type ShipmentStatus = NonNullable<typeof shipments.$inferInsert.status>;
    type DeliveryStatusEnum = NonNullable<typeof shipments.$inferInsert.deliveryStatus>;

    const deliveryStatusMap: Record<string, { shipmentStatus: ShipmentStatus; deliveryStatusEnum: DeliveryStatusEnum }> = {
      'Booked': { shipmentStatus: 'pending', deliveryStatusEnum: 'booked' },
      'Received at Warehouse': { shipmentStatus: 'pending', deliveryStatusEnum: 'received_at_warehouse' },
      'Security Cleared': { shipmentStatus: 'pending', deliveryStatusEnum: 'security_cleared' },
      'Manifested': { shipmentStatus: 'pending', deliveryStatusEnum: 'manifested' },
      'Departed': { shipmentStatus: 'in_transit', deliveryStatusEnum: 'departed' },
      'Transshipment': { shipmentStatus: 'in_transit', deliveryStatusEnum: 'transshipment' },
      'Arrived at Destination Airports': { shipmentStatus: 'processing', deliveryStatusEnum: 'arrived_at_destination' },
      'Out for Delivery': { shipmentStatus: 'processing', deliveryStatusEnum: 'out_for_delivery' },
      'Ready for Pickup': { shipmentStatus: 'processing', deliveryStatusEnum: 'ready_for_pickup' },
      'Delivered': { shipmentStatus: 'delivered', deliveryStatusEnum: 'delivered' },
    };

    let shipmentStatus: ShipmentStatus = 'pending';
    let deliveryStatusEnum: DeliveryStatusEnum = 'booked';
    if (deliveryStatus && deliveryStatusMap[deliveryStatus]) {
      shipmentStatus = deliveryStatusMap[deliveryStatus].shipmentStatus;
      deliveryStatusEnum = deliveryStatusMap[deliveryStatus].deliveryStatusEnum;
    }

    // Final capacity re-check immediately before insert. The neon-http driver does not support
    // interactive transactions, so this narrows (does not eliminate) the race window where a
    // concurrent shipment could have consumed capacity since the validation above.
    if (airplane?.maxWeightKg && availableFlight) {
      const maxWeight = Number(airplane.maxWeightKg);
      const [{ value: latestLoad }] = await db
        .select({ value: sql<string>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)` })
        .from(shipments)
        .where(
          and(
            eq(shipments.flightId, availableFlight.id),
            inArray(shipments.status, ['pending', 'processing', 'in_transit'])
          )
        );

      if ((Number(latestLoad) + productWeightValue) > maxWeight) {
        return NextResponse.json({
          error: `Aircraft capacity changed during processing. Available capacity is no longer sufficient for this shipment. Please retry.`,
        }, { status: 409 });
      }
    }

    const [newShipment] = await db
      .insert(shipments)
      .values({
        awbNumber,
        flightId: availableFlight?.id,
        originAirportId: originAirport.id,
        destAirportId: destAirport.id,
        priority,
        productType,
        quantity: 1,
        weightKg: String(productWeightValue),
        status: shipmentStatus,
        deliveryStatus: deliveryStatusEnum,
        notes: buildShipmentNotes({
          sender,
          receiver,
          telpNumber,
          originAddress,
          destinationAddress,
          deliveryType,
          shippingFee: formatShippingFee(shippingFee),
          weightUnit,
          shippingDate,
          notes,
        }),
        createdBy: user.id,
        estimatedDelivery: shippingDate ? new Date(new Date(shippingDate).getTime() + 3 * 24 * 60 * 60 * 1000) : undefined,
      })
      .returning();

    await db.insert(shipmentEvents).values({
      shipmentId: newShipment.id,
      status: shipmentStatus,
      location: originAddress,
      notes: `Shipment created - ${deliveryStatus || 'Booked'}`,
      changedBy: user.id,
    });

    // Log shipment creation activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'create',
      entityType: 'shipment',
      entityId: newShipment.id,
      details: {
        awbNumber: newShipment.awbNumber,
        origin: originIata,
        destination: destIata,
        weight: productWeight,
        priority,
      },
      request,
    });

    return NextResponse.json({ success: true, data: newShipment }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/shipments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
