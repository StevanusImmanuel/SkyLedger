import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airlines, airplanes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allAirlines = await db.select().from(airlines).orderBy(airlines.airlineName);

    return NextResponse.json({
      success: true,
      data: allAirlines,
    });
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airlines' },
      { status: 500 }
    );
  }
}
