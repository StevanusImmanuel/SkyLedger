import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, shipmentEvents } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { updateShipmentSchema } from '@/lib/validations/shipment';
import { eq } from 'drizzle-orm';

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
      flight: true,
      createdByUser: { columns: { id: true, name: true, skyledgerId: true } },
      events: { orderBy: (e, { desc }) => [desc(e.occurredAt)] },
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
    const parsed = updateShipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { status, statusNote, ...fields } = parsed.data;

    await db
      .update(shipments)
      .set({ ...fields, ...(status ? { status } : {}), updatedAt: new Date() })
      .where(eq(shipments.id, id));

    if (status) {
      await db.insert(shipmentEvents).values({
        shipmentId: id,
        status,
        notes: statusNote,
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

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  await db.delete(shipments).where(eq(shipments.id, id));
  return NextResponse.json({ success: true });
}
