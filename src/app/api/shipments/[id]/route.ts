import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, shipmentEvents, airports, flights, airlines, airplanes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { updateShipmentSchema } from '@/lib/validations/shipment';
import { eq, and } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, id),
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
      events: {
        orderBy: (e, { desc }) => [desc(e.occurredAt)],
        with: {
          changedByUser: { columns: { id: true, name: true } },
        },
      },
    },
  });

  if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: shipment });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  try {
    const body = await request.json();

    // Extended update fields based on CRUDDB.md
    const {
      deliveryStatus,
      productType,
      airlineId,
      airplaneId,
      shippingDate,
      productWeight,
      originAddress,
      destinationAddress,
      originIata,
      destIata,
      notes,
      sender,
      receiver,
      telpNumber,
    } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // Map delivery status to shipment status and delivery_status enum
    if (deliveryStatus) {
      type ShipmentStatus = 'pending' | 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
      type DeliveryStatusEnum = 'booked' | 'received_at_warehouse' | 'security_cleared' | 'manifested' | 'departed' | 'transshipment' | 'arrived_at_destination' | 'out_for_delivery' | 'ready_for_pickup' | 'delivered';

      const statusMap: Record<string, { shipmentStatus: ShipmentStatus; deliveryStatusEnum: DeliveryStatusEnum }> = {
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

      const mapped = statusMap[deliveryStatus];
      if (mapped) {
        updateData.status = mapped.shipmentStatus;
        updateData.deliveryStatus = mapped.deliveryStatusEnum;

        if (deliveryStatus === 'Delivered') {
          updateData.actualDelivery = new Date();
        }
      }
    }

    // Update product type
    if (productType) {
      updateData.productType = productType;
    }

    // Update weight
    if (productWeight) {
      updateData.weightKg = String(productWeight);
    }

    // Update airports if IATA codes provided
    if (originIata) {
      const originAirport = await db.query.airports.findFirst({
        where: eq(airports.iataCode, originIata),
      });
      if (originAirport) updateData.originAirportId = originAirport.id;
    }

    if (destIata) {
      const destAirport = await db.query.airports.findFirst({
        where: eq(airports.iataCode, destIata),
      });
      if (destAirport) updateData.destAirportId = destAirport.id;
    }

    // Update flight if airplane changed
    if (airplaneId) {
      const availableFlight = await db.query.flights.findFirst({
        where: and(
          eq(flights.airplaneId, airplaneId),
          eq(flights.status, 'scheduled')
        ),
      });
      if (availableFlight) updateData.flightId = availableFlight.id;
    }

    // Update notes with additional info
    if (notes || sender || receiver || telpNumber || originAddress || destinationAddress) {
      const noteParts = [];
      if (notes) noteParts.push(notes);
      if (sender) noteParts.push(`Sender: ${sender}`);
      if (receiver) noteParts.push(`Receiver: ${receiver}`);
      if (telpNumber) noteParts.push(`Tel: ${telpNumber}`);
      if (originAddress) noteParts.push(`Origin: ${originAddress}`);
      if (destinationAddress) noteParts.push(`Dest: ${destinationAddress}`);

      updateData.notes = noteParts.join(', ');
    }

    await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id));

    // Create event if status changed
    if (deliveryStatus) {
      await db.insert(shipmentEvents).values({
        shipmentId: id,
        status: updateData.status as any,
        location: destinationAddress || originAddress,
        notes: `Status updated to: ${deliveryStatus}`,
        changedBy: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/shipments/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'admin' && user.role !== 'operator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    // Hard delete - cascade will delete related shipment_events
    await db.delete(shipments).where(eq(shipments.id, id));

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/shipments/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
