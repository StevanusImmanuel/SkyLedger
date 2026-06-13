import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airplanes, airlines } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('terminal_session')?.value;
    const user = token ? await getSessionUser(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const airlineId = searchParams.get('airlineId');

    const whereConditions = airlineId
      ? eq(airplanes.airlineId, parseInt(airlineId))
      : undefined;

    const allAirplanes = await db
      .select({
        airplaneId: airplanes.airplaneId,
        flightNumber: airplanes.flightNumber,
        model: airplanes.model,
        capacity: airplanes.capacity,
        airlineId: airplanes.airlineId,
        airlineName: airlines.airlineName,
        airlineCode: airlines.airlineCode,
      })
      .from(airplanes)
      .leftJoin(airlines, eq(airplanes.airlineId, airlines.airlineId))
      .where(whereConditions)
      .orderBy(airplanes.flightNumber);

    return NextResponse.json({
      success: true,
      data: allAirplanes,
    });
  } catch (error) {
    console.error('Error fetching airplanes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airplanes' },
      { status: 500 }
    );
  }
}
