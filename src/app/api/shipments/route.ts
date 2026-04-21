import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, shipmentEvents, airports } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { createShipmentSchema } from '@/lib/validations/shipment';
import { eq, desc, and, SQL } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

function generateAwbNumber(): string {
  const year = new Date().getFullYear();
  return `SL-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get('status') as typeof shipments.$inferSelect.status | null;
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const offset = Number(searchParams.get('offset') ?? 0);

  const where: SQL | undefined = statusFilter ? eq(shipments.status, statusFilter) : undefined;

  const rows = await db.query.shipments.findMany({
    where,
    with: {
      originAirport: true,
      destAirport: true,
      flight: true,
      createdByUser: { columns: { id: true, name: true, skyledgerId: true } },
    },
    orderBy: [desc(shipments.createdAt)],
    limit,
    offset,
  });

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createShipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const [originAirport, destAirport] = await Promise.all([
      db.query.airports.findFirst({ where: eq(airports.iataCode, parsed.data.originIata) }),
      db.query.airports.findFirst({ where: eq(airports.iataCode, parsed.data.destIata) }),
    ]);

    const awbNumber = parsed.data.awbNumber ?? generateAwbNumber();

    const [newShipment] = await db
      .insert(shipments)
      .values({
        awbNumber,
        flightId: parsed.data.flightId,
        originAirportId: originAirport?.id,
        destAirportId: destAirport?.id,
        priority: parsed.data.priority,
        productType: parsed.data.productType,
        quantity: parsed.data.quantity,
        weightKg: String(parsed.data.weightKg),
        notes: parsed.data.notes,
        createdBy: user.id,
      })
      .returning();

    await db.insert(shipmentEvents).values({
      shipmentId: newShipment.id,
      status: 'pending',
      notes: 'Shipment created',
      changedBy: user.id,
    });

    return NextResponse.json({ success: true, data: newShipment }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/shipments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
