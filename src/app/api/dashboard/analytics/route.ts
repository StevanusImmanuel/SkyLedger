import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments, flights, airports, airplanes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { sql, eq, desc, count, inArray } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

// Fallback airport coordinates for common IATA codes
const AIRPORT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'JFK': { lat: 40.6413, lng: -73.7781 },   // New York JFK
  'LAX': { lat: 33.9416, lng: -118.4085 },  // Los Angeles
  'LHR': { lat: 51.4700, lng: -0.4543 },    // London Heathrow
  'CDG': { lat: 49.0097, lng: 2.5479 },     // Paris Charles de Gaulle
  'DXB': { lat: 25.2532, lng: 55.3657 },    // Dubai
  'SIN': { lat: 1.3644, lng: 103.9915 },    // Singapore
  'HKG': { lat: 22.3080, lng: 113.9185 },   // Hong Kong
  'NRT': { lat: 35.7720, lng: 140.3929 },   // Tokyo Narita
  'SYD': { lat: -33.9399, lng: 151.1753 },  // Sydney
  'FRA': { lat: 50.0379, lng: 8.5622 },     // Frankfurt
  'AMS': { lat: 52.3105, lng: 4.7683 },     // Amsterdam
  'ICN': { lat: 37.4602, lng: 126.4407 },   // Seoul Incheon
  'BKK': { lat: 13.6900, lng: 100.7501 },   // Bangkok
  'ORD': { lat: 41.9742, lng: -87.9073 },   // Chicago O'Hare
  'ATL': { lat: 33.6407, lng: -84.4277 },   // Atlanta
  'PEK': { lat: 40.0799, lng: 116.6031 },   // Beijing
  'PVG': { lat: 31.1443, lng: 121.8083 },   // Shanghai Pudong
  'DEL': { lat: 28.5562, lng: 77.1000 },    // Delhi
  'IST': { lat: 41.2753, lng: 28.7519 },    // Istanbul
  'MAD': { lat: 40.4983, lng: -3.5676 },    // Madrid
  'BCN': { lat: 41.2974, lng: 2.0833 },     // Barcelona
  'MUC': { lat: 48.3537, lng: 11.7750 },    // Munich
  'FCO': { lat: 41.8003, lng: 12.2389 },    // Rome Fiumicino
  'YYZ': { lat: 43.6777, lng: -79.6248 },   // Toronto
  'MEX': { lat: 19.4363, lng: -99.0721 },   // Mexico City
  'GRU': { lat: -23.4356, lng: -46.4731 },  // São Paulo
  'JNB': { lat: -26.1392, lng: 28.2460 },   // Johannesburg
  'CAI': { lat: 30.1219, lng: 31.4056 },    // Cairo
  'DFW': { lat: 32.8998, lng: -97.0403 },   // Dallas/Fort Worth
  'SFO': { lat: 37.6213, lng: -122.3790 },  // San Francisco
  'SEA': { lat: 47.4502, lng: -122.3088 },  // Seattle
  'MIA': { lat: 25.7959, lng: -80.2870 },   // Miami
  'LAS': { lat: 36.0840, lng: -115.1537 },  // Las Vegas
  'BOS': { lat: 42.3656, lng: -71.0096 },   // Boston
  'IAH': { lat: 29.9902, lng: -95.3368 },   // Houston
  'PHX': { lat: 33.4352, lng: -112.0101 },  // Phoenix
  'DEN': { lat: 39.8561, lng: -104.6737 },  // Denver
};

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Get active shipments for map (based on delivery_status)
    // Active means: booked, received_at_warehouse, security_cleared, manifested, departed, transshipment
    const activeShipments = await db.query.shipments.findMany({
      where: inArray(shipments.deliveryStatus, [
        'booked',
        'received_at_warehouse',
        'security_cleared',
        'manifested',
        'departed',
        'transshipment'
      ]),
      with: {
        originAirport: true,
        destAirport: true,
      },
    });

    console.log('[Dashboard] Total active shipments found:', activeShipments.length);
    if (activeShipments.length > 0) {
      console.log('[Dashboard] First shipment:', {
        awb: activeShipments[0].awbNumber,
        deliveryStatus: activeShipments[0].deliveryStatus,
        originAirport: activeShipments[0].originAirport?.iataCode,
        destAirport: activeShipments[0].destAirport?.iataCode,
      });
    }

    // Map shipments with coordinates (use fallback if database doesn't have them)
    const shipmentMapData = activeShipments
      .filter(s => s.originAirport && s.destAirport)
      .map(s => {
        const originIata = s.originAirport!.iataCode;
        const destIata = s.destAirport!.iataCode;

        // Try to get coordinates from database first, then fallback to hardcoded values
        const originLat = s.originAirport!.latitude
          ? Number(s.originAirport!.latitude)
          : AIRPORT_COORDINATES[originIata]?.lat;
        const originLng = s.originAirport!.longitude
          ? Number(s.originAirport!.longitude)
          : AIRPORT_COORDINATES[originIata]?.lng;
        const destLat = s.destAirport!.latitude
          ? Number(s.destAirport!.latitude)
          : AIRPORT_COORDINATES[destIata]?.lat;
        const destLng = s.destAirport!.longitude
          ? Number(s.destAirport!.longitude)
          : AIRPORT_COORDINATES[destIata]?.lng;

        console.log('[Dashboard] Processing shipment:', {
          awb: s.awbNumber,
          originIata,
          destIata,
          originLat,
          originLng,
          destLat,
          destLng,
          hasCoords: !!(originLat && originLng && destLat && destLng)
        });

        // Only include if we have valid coordinates
        if (!originLat || !originLng || !destLat || !destLng) {
          return null;
        }

        return {
          id: s.id,
          awbNumber: s.awbNumber,
          originLat,
          originLng,
          originIata,
          destLat,
          destLng,
          destIata,
          status: s.status,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    console.log('[Dashboard] Shipments with valid coordinates:', shipmentMapData.length);
    console.log('[Dashboard] Shipment map data:', shipmentMapData);

    // Top 5 routes by total shipment weight
    // For each route, get the plane that carries the most weight
    const topRoutesRaw = await db
      .select({
        originCode: airports.iataCode,
        originCity: airports.city,
        originCountry: airports.country,
        destCode: sql<string>`dest_airport.iata_code`,
        destCity: sql<string>`dest_airport.city`,
        destCountry: sql<string>`dest_airport.country`,
        planeId: sql<string>`(
          SELECT ap.flight_number
          FROM shipments s2
          LEFT JOIN flights f2 ON s2.flight_id = f2.id
          LEFT JOIN airplanes ap ON f2.airplane_id = ap.airplane_id
          WHERE s2.origin_airport_id = ${shipments.originAirportId}
            AND s2.dest_airport_id = ${shipments.destAirportId}
            AND ap.flight_number IS NOT NULL
          GROUP BY ap.flight_number
          ORDER BY SUM(CAST(s2.weight_kg AS NUMERIC)) DESC
          LIMIT 1
        )`,
        totalWeight: sql<number>`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`,
        shipmentCount: count(),
      })
      .from(shipments)
      .innerJoin(airports, eq(shipments.originAirportId, airports.id))
      .innerJoin(sql`airports AS dest_airport`, sql`${shipments.destAirportId} = dest_airport.id`)
      .groupBy(
        airports.iataCode,
        airports.city,
        airports.country,
        sql`dest_airport.iata_code`,
        sql`dest_airport.city`,
        sql`dest_airport.country`,
        shipments.originAirportId,
        shipments.destAirportId
      )
      .orderBy(desc(sql`COALESCE(SUM(CAST(${shipments.weightKg} AS NUMERIC)), 0)`))
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        shipmentMapData,
        topRoutes: topRoutesRaw.map((r) => ({
          destination: `${r.originCode} → ${r.destCode}`,
          destinationDetail: `${r.originCity}, ${r.originCountry} to ${r.destCity}, ${r.destCountry}`,
          planeId: r.planeId || 'N/A',
          totalWeight: `${(Number(r.totalWeight) / 1000).toFixed(1)} MT`,
        })),
      },
    });
  } catch (err) {
    console.error('[GET /api/dashboard/analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
