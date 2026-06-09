import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, shipmentEvents, airports, flights } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import {
  calculateShippingFee,
  formatShippingFee,
  isShipmentPriority,
} from '@/lib/shipments/shipping-fee';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

type RouteContext = { params: Promise<{ id: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NOTE_LABELS = [
  'Shipping Date',
  'Sender',
  'Receiver',
  'Tel',
  'Origin',
  'Dest',
  'Delivery',
  'Fee',
  'Weight Unit',
  'Notes',
];

function setNoteValue(notes: string | null, label: string, value: unknown) {
  const nextValue = String(value ?? '').trim();
  const currentNotes = notes || '';

  if (!nextValue) return currentNotes;

  const stopLabels = NOTE_LABELS.filter((item) => item !== label).join('|');
  const labelPattern = new RegExp(`(?:^|,\\s*)${label}:\\s*[\\s\\S]*?(?=,\\s*(?:${stopLabels}):|$)`, 'i');
  const replacement = `${label}: ${nextValue}`;

  if (labelPattern.test(currentNotes)) {
    return currentNotes.replace(labelPattern, (match) => {
      const prefix = match.startsWith(',') ? ', ' : '';
      return `${prefix}${replacement}`;
    });
  }

  return currentNotes ? `${currentNotes}, ${replacement}` : replacement;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const shipmentIdentifier = (() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  })();
  const shipmentWhere = UUID_PATTERN.test(id)
    ? eq(shipments.id, id)
    : eq(shipments.awbNumber, shipmentIdentifier);

  const shipment = await db.query.shipments.findFirst({
    where: shipmentWhere,
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
      airplaneId,
      airlineId,
      productWeight,
      priority,
      originAddress,
      destinationAddress,
      originIata,
      destIata,
      notes,
      sender,
      receiver,
      telpNumber,
      shippingDate,
      originalUpdatedAt,
    } = body;

    const existingShipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
      columns: {
        priority: true,
        weightKg: true,
        notes: true,
        updatedAt: true,
      },
    });

    if (!existingShipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    // Check for concurrent update conflict
    if (originalUpdatedAt) {
      const dbTime = new Date(existingShipment.updatedAt).getTime();
      const clientTime = new Date(originalUpdatedAt).getTime();
      if (Math.abs(dbTime - clientTime) > 1000) {
        return NextResponse.json({
          error: 'Concurrent update conflict: This shipment has been modified by another operator. Please reload and try again.'
        }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const nextPriority = priority ?? existingShipment.priority;

    if (!isShipmentPriority(nextPriority)) {
      return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 });
    }

    if (priority !== undefined) {
      updateData.priority = nextPriority;
    }

    const productWeightProvided = productWeight !== undefined && productWeight !== '';
    const nextProductWeight = productWeightProvided
      ? Number(productWeight)
      : Number(existingShipment.weightKg || 0);

    if (!Number.isFinite(nextProductWeight) || nextProductWeight < 0) {
      return NextResponse.json({ error: 'Product weight must be a non-negative number' }, { status: 400 });
    }

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
    if (productWeightProvided) {
      updateData.weightKg = String(nextProductWeight);
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
      let availableFlight = await db.query.flights.findFirst({
        where: and(
          eq(flights.airplaneId, airplaneId),
          eq(flights.status, 'scheduled')
        ),
      });

      // If no scheduled flight exists, create one
      if (!availableFlight) {
        const originAirportForFlight = originIata
          ? await db.query.airports.findFirst({ where: eq(airports.iataCode, originIata) })
          : null;
        const destAirportForFlight = destIata
          ? await db.query.airports.findFirst({ where: eq(airports.iataCode, destIata) })
          : null;

        const [newFlight] = await db
          .insert(flights)
          .values({
            airplaneId: airplaneId,
            originAirportId: originAirportForFlight?.id,
            destAirportId: destAirportForFlight?.id,
            status: 'scheduled',
          })
          .returning();
        availableFlight = newFlight;
      }

      if (availableFlight) updateData.flightId = availableFlight.id;
    }

    let updatedNotes = typeof notes === 'string' ? notes : existingShipment.notes || '';
    updatedNotes = setNoteValue(updatedNotes, 'Shipping Date', shippingDate);
    updatedNotes = setNoteValue(updatedNotes, 'Sender', sender);
    updatedNotes = setNoteValue(updatedNotes, 'Receiver', receiver);
    updatedNotes = setNoteValue(updatedNotes, 'Tel', telpNumber);
    updatedNotes = setNoteValue(updatedNotes, 'Origin', originAddress);
    updatedNotes = setNoteValue(updatedNotes, 'Dest', destinationAddress);
    updatedNotes = setNoteValue(
      updatedNotes,
      'Fee',
      formatShippingFee(calculateShippingFee(nextProductWeight, nextPriority))
    );
    updateData.notes = updatedNotes;

    await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id));

    // Create event if status changed
    if (deliveryStatus) {
      type ShipmentEventInsert = typeof shipmentEvents.$inferInsert;

      await db.insert(shipmentEvents).values({
        shipmentId: id,
        status: updateData.status as ShipmentEventInsert['status'],
        location: destinationAddress || originAddress,
        notes: `Status updated to: ${deliveryStatus}`,
        changedBy: user.id,
      });
    }

    // Log shipment update activity
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
      columns: { awbNumber: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'update',
      entityType: 'shipment',
      entityId: id,
      details: {
        awbNumber: shipment?.awbNumber,
        updatedFields: Object.keys(body),
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/shipments/:id]', err);
    return NextResponse.json(
      { error: 'Failed to update shipment. Please check your input and try again.' },
      { status: 500 }
    );
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
    // Get shipment info before deleting
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
      columns: { awbNumber: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found or already deleted' }, { status: 404 });
    }

    // Hard delete - cascade will delete related shipment_events
    await db.delete(shipments).where(eq(shipments.id, id));

    // Log shipment deletion activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'delete',
      entityType: 'shipment',
      entityId: id,
      details: { awbNumber: shipment.awbNumber },
      request,
    });

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/shipments/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
