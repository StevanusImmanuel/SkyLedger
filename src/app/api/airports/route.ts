import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airports } from '@/lib/db/schema';

export async function GET() {
  try {
    const allAirports = await db.select().from(airports).orderBy(airports.city);

    return NextResponse.json({
      success: true,
      data: allAirports,
    });
  } catch (error) {
    console.error('Error fetching airports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airports' },
      { status: 500 }
    );
  }
}
