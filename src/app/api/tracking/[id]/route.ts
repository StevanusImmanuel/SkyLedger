import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isRateLimited } from '@/lib/rate-limit';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_TRACKING_PATTERN = /^[a-zA-Z0-9-]+$/;

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

function sanitizeNotesForPublic(notes: string | null): string {
  if (!notes) return '';
  let sanitized = notes;
  sanitized = setNoteValue(sanitized, 'Sender', 'REDACTED');
  sanitized = setNoteValue(sanitized, 'Receiver', 'REDACTED');
  sanitized = setNoteValue(sanitized, 'Tel', 'REDACTED');
  sanitized = setNoteValue(sanitized, 'Origin', 'REDACTED');
  sanitized = setNoteValue(sanitized, 'Dest', 'REDACTED');
  return sanitized;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  // 1. Get Client IP and check rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             'anonymous';

  if (isRateLimited(ip, 20, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many tracking requests. Please try again later.' },
      { status: 429 }
    );
  }

  // 2. Extract and validate ID parameter
  const { id } = await context.params;
  const decodedId = (() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  })();

  if (!UUID_PATTERN.test(decodedId) && !SAFE_TRACKING_PATTERN.test(decodedId)) {
    return NextResponse.json(
      { error: 'Invalid tracking number format' },
      { status: 400 }
    );
  }

  try {
    // 3. Query the database securely using Drizzle ORM
    const shipmentWhere = UUID_PATTERN.test(decodedId)
      ? eq(shipments.id, decodedId)
      : eq(shipments.awbNumber, decodedId);

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
        events: {
          orderBy: (e, { desc }) => [desc(e.occurredAt)],
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'No shipment found with that tracking number' },
        { status: 404 }
      );
    }

    // 4. Sanitize and redact PII for public view
    const publicShipment = {
      id: shipment.id,
      awbNumber: shipment.awbNumber,
      priority: shipment.priority,
      status: shipment.status,
      deliveryStatus: shipment.deliveryStatus,
      productType: shipment.productType,
      weightKg: shipment.weightKg,
      notes: sanitizeNotesForPublic(shipment.notes),
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      createdAt: shipment.createdAt,
      originAirport: shipment.originAirport,
      destAirport: shipment.destAirport,
      flight: shipment.flight,
      events: shipment.events?.map(e => ({
        id: e.id,
        shipmentId: e.shipmentId,
        status: e.status,
        location: e.location,
        notes: e.notes,
        occurredAt: e.occurredAt
      }))
    };

    return NextResponse.json({ success: true, data: publicShipment });
  } catch (error) {
    console.error('[GET /api/tracking/[id]]', error);
    return NextResponse.json(
      { error: 'Internal system error' },
      { status: 500 }
    );
  }
}
