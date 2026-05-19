import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, users, sessions } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('terminal_session')?.value;

    // Count data in tables
    const [shipmentCount] = await db.select({ count: count() }).from(shipments);
    const [userCount] = await db.select({ count: count() }).from(users);
    const [sessionCount] = await db.select({ count: count() }).from(sessions);

    // Get sample shipment
    const sampleShipments = await db.query.shipments.findMany({
      limit: 3,
      with: {
        originAirport: true,
        destAirport: true,
        flight: true,
      },
    });

    // Get sample users (without password hash)
    const sampleUsers = await db.query.users.findMany({
      limit: 5,
      columns: {
        skyledgerId: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      debug: {
        hasSessionCookie: !!token,
        sessionToken: token ? `${token.substring(0, 10)}...` : null,
        counts: {
          shipments: shipmentCount.count,
          users: userCount.count,
          sessions: sessionCount.count,
        },
        sampleShipments: sampleShipments.map(s => ({
          awb: s.awbNumber,
          status: s.status,
          origin: s.originAirport?.iataCode,
          dest: s.destAirport?.iataCode,
          flight: s.flight?.flightId,
        })),
        sampleUsers: sampleUsers.map(u => ({
          skyledgerId: u.skyledgerId,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
        })),
        loginInstructions: 'You need to log in at http://localhost:3000/login/auth to access the dashboard and shipments data. Use one of the skyledgerId values above as username.',
      },
    });
  } catch (err) {
    console.error('[GET /api/debug]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
