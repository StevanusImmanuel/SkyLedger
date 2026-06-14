import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airplanes, shipments, flights } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log("Populating database tables...");

    // 1. Update Airplanes maxWeightKg and maxVolumeM3
    const allPlanes = await db.select().from(airplanes);
    let planesUpdated = 0;

    for (const plane of allPlanes) {
      const model = plane.model.toLowerCase();
      let maxWeight = 10000; // default
      let maxVolume = 75;    // default

      if (model.includes('777-300er')) {
        maxWeight = 20000;
        maxVolume = 150;
      } else if (model.includes('777-200er')) {
        maxWeight = 18000;
        maxVolume = 130;
      } else if (model.includes('a330-300')) {
        maxWeight = 18000;
        maxVolume = 130;
      } else if (model.includes('a330-200')) {
        maxWeight = 16000;
        maxVolume = 115;
      } else if (model.includes('737-800f')) {
        maxWeight = 22000;
        maxVolume = 140;
      } else if (model.includes('767-300f')) {
        maxWeight = 52000;
        maxVolume = 430;
      } else if (model.includes('737-800')) {
        maxWeight = 6000;
        maxVolume = 45;
      } else if (model.includes('737 max 8') || model.includes('737-max8')) {
        maxWeight = 6500;
        maxVolume = 48;
      } else if (model.includes('a320neo')) {
        maxWeight = 5000;
        maxVolume = 37;
      } else if (model.includes('a321neo')) {
        maxWeight = 6000;
        maxVolume = 45;
      } else if (model.includes('787-10')) {
        maxWeight = 15000;
        maxVolume = 110;
      } else if (model.includes('787-9')) {
        maxWeight = 14000;
        maxVolume = 100;
      } else if (model.includes('787-8')) {
        maxWeight = 13000;
        maxVolume = 90;
      } else if (model.includes('a350-900')) {
        maxWeight = 16000;
        maxVolume = 120;
      } else if (model.includes('a350-1000')) {
        maxWeight = 18000;
        maxVolume = 135;
      } else if (model.includes('atr 72')) {
        maxWeight = 1500;
        maxVolume = 12;
      } else if (model.includes('a321')) {
        maxWeight = 5500;
        maxVolume = 42;
      } else if (model.includes('a320')) {
        maxWeight = 4800;
        maxVolume = 35;
      } else if (model.includes('a380')) {
        maxWeight = 25000;
        maxVolume = 170;
      }

      await db
        .update(airplanes)
        .set({
          maxWeightKg: maxWeight.toString(),
          maxVolumeM3: maxVolume.toString(),
        })
        .where(eq(airplanes.airplaneId, plane.airplaneId));
      planesUpdated++;
    }

    // 2. Inspect and update shipments if necessary (e.g. check weight limits)
    const allShipments = await db.select().from(shipments);
    let shipmentsUpdated = 0;

    for (const shipment of allShipments) {
      let needsUpdate = false;
      const updates: any = {};

      // If shipment weight is null or 0, give it a valid mock weight
      if (!shipment.weightKg || Number(shipment.weightKg) <= 0) {
        updates.weightKg = (Math.floor(Math.random() * 4000) + 100).toString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db
          .update(shipments)
          .set(updates)
          .where(eq(shipments.id, shipment.id));
        shipmentsUpdated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database tables populated successfully.",
      planesUpdated,
      shipmentsUpdated,
    });
  } catch (err: any) {
    console.error('[GET /api/debug/populate]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
