import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, shipmentEvents, airports, flights, airlines } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import {
  calculateShippingFeeFromInput,
  formatShippingFee,
  isShipmentPriority,
} from '@/lib/shipments/shipping-fee';
import { eq, desc, and, or, ilike, count, gte, lte, SQL } from 'drizzle-orm';

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
    const deliveryStatusFilter = searchParams.get('deliveryStatus') as typeof shipments.$inferSelect.deliveryStatus | null;
    const search = searchParams.get('search') || '';
    const airport = searchParams.get('airport') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 1000);
    const offset = Number(searchParams.get('offset') ?? 0);

    const conditions: SQL[] = [];

    if (statusFilter) {
      conditions.push(eq(shipments.status, statusFilter));
    }

    if (deliveryStatusFilter) {
      conditions.push(eq(shipments.deliveryStatus, deliveryStatusFilter));
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
  } catch (error) {
    console.error('[GET /api/shipments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    // Extended validation for CRUDDB requirements
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
    const productWeightValue = Number(productWeight);
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
      return NextResponse.json({ error: 'Invalid airline' }, { status: 400 });
    }

    // Get airports
    const [originAirport, destAirport] = await Promise.all([
      db.query.airports.findFirst({ where: eq(airports.iataCode, originIata) }),
      db.query.airports.findFirst({ where: eq(airports.iataCode, destIata) }),
    ]);

    // Find available flight
    const availableFlight = await db.query.flights.findFirst({
      where: and(
        eq(flights.airplaneId, airplaneId),
        eq(flights.status, 'scheduled')
      ),
    });

    // Generate AWB with airline code
    const awbNumber = generateAwbNumber(airline.airlineCode);

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

    const [newShipment] = await db
      .insert(shipments)
      .values({
        awbNumber,
        flightId: availableFlight?.id,
        originAirportId: originAirport?.id,
        destAirportId: destAirport?.id,
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

    return NextResponse.json({ success: true, data: newShipment }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/shipments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
