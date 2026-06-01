import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Get ALL shipments to see what we have
    const allShipments = await db.query.shipments.findMany({
      with: {
        originAirport: true,
        destAirport: true,
      },
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalShipments: allShipments.length,
        shipments: allShipments.map(s => ({
          awbNumber: s.awbNumber,
          status: s.status,
          deliveryStatus: s.deliveryStatus,
          originAirport: s.originAirport ? {
            iataCode: s.originAirport.iataCode,
            name: s.originAirport.name,
            hasLat: !!s.originAirport.latitude,
            hasLng: !!s.originAirport.longitude,
          } : null,
          destAirport: s.destAirport ? {
            iataCode: s.destAirport.iataCode,
            name: s.destAirport.name,
            hasLat: !!s.destAirport.latitude,
            hasLng: !!s.destAirport.longitude,
          } : null,
        })),
      },
    });
  } catch (err) {
    console.error('[GET /api/dashboard/debug]', err);
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
