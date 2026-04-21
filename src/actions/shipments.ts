'use server';

import { db } from '@/lib/db';
import { shipments, shipmentEvents, airports } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/dal';
import { createShipmentSchema, updateShipmentSchema } from '@/lib/validations/shipment';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function generateAwbNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SL-${year}-${random}`;
}

async function resolveAirportId(iata: string): Promise<number | null> {
  const airport = await db.query.airports.findFirst({
    where: eq(airports.iataCode, iata.toUpperCase()),
  });
  return airport?.id ?? null;
}

export async function createShipmentAction(_prev: unknown, formData: FormData) {
  const user = await requireAuth();

  const parsed = createShipmentSchema.safeParse({
    awbNumber: formData.get('awbNumber') || undefined,
    flightId: formData.get('flightId') || undefined,
    originIata: formData.get('originIata'),
    destIata: formData.get('destIata'),
    priority: formData.get('priority') ?? 'standard',
    productType: formData.get('productType'),
    quantity: Number(formData.get('quantity')),
    weightKg: Number(formData.get('weightKg')),
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const [originAirportId, destAirportId] = await Promise.all([
    resolveAirportId(parsed.data.originIata),
    resolveAirportId(parsed.data.destIata),
  ]);

  const awbNumber = parsed.data.awbNumber ?? generateAwbNumber();

  const [newShipment] = await db
    .insert(shipments)
    .values({
      awbNumber,
      flightId: parsed.data.flightId,
      originAirportId,
      destAirportId,
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

  revalidatePath('/shipments');
  return { success: true, awbNumber: newShipment.awbNumber };
}

export async function updateShipmentAction(
  shipmentId: string,
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireAuth();

  const parsed = updateShipmentSchema.safeParse({
    status: formData.get('status') || undefined,
    statusNote: formData.get('statusNote') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await db
    .update(shipments)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(shipments.id, shipmentId));

  if (parsed.data.status) {
    await db.insert(shipmentEvents).values({
      shipmentId,
      status: parsed.data.status,
      notes: parsed.data.statusNote,
      changedBy: user.id,
    });
  }

  revalidatePath('/shipments');
  revalidatePath(`/shipments/${shipmentId}`);
  return { success: true };
}
