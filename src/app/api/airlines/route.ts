import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airlines } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('terminal_session')?.value;
    const user = token ? await getSessionUser(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
