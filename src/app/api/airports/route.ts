import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airports } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('terminal_session')?.value;
    const user = token ? await getSessionUser(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
