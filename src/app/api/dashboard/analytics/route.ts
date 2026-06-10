import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipments } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { inArray } from 'drizzle-orm';

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
}

const EMPTY_DASHBOARD_DATA = {
  shipmentMapData: [],
  topRoutes: [],
};

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
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

        // Only include if we have valid coordinates
        if (
          !Number.isFinite(originLat) ||
          !Number.isFinite(originLng) ||
          !Number.isFinite(destLat) ||
          !Number.isFinite(destLng)
        ) {
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

    const routeShipments = await db.query.shipments.findMany({
      with: {
        originAirport: true,
        destAirport: true,
        flight: {
          with: {
            airplane: true,
          },
        },
      },
    });

    const routeMap = new Map<
      string,
      {
        originCode: string;
        originCity: string;
        originCountry: string;
        destCode: string;
        destCity: string;
        destCountry: string;
        totalWeight: number;
        planeWeights: Map<string, number>;
      }
    >();

    for (const shipment of routeShipments) {
      if (!shipment.originAirport || !shipment.destAirport) continue;

      const routeKey = `${shipment.originAirport.id}-${shipment.destAirport.id}`;
      const weight = Number(shipment.weightKg || 0);
      const safeWeight = Number.isFinite(weight) ? weight : 0;
      const existing = routeMap.get(routeKey) || {
        originCode: shipment.originAirport.iataCode,
        originCity: shipment.originAirport.city || 'Unknown',
        originCountry: shipment.originAirport.country || 'N/A',
        destCode: shipment.destAirport.iataCode,
        destCity: shipment.destAirport.city || 'Unknown',
        destCountry: shipment.destAirport.country || 'N/A',
        totalWeight: 0,
        planeWeights: new Map<string, number>(),
      };

      existing.totalWeight += safeWeight;
      const planeId = shipment.flight?.airplane?.flightNumber;
      if (planeId) {
        existing.planeWeights.set(planeId, (existing.planeWeights.get(planeId) || 0) + safeWeight);
      }
      routeMap.set(routeKey, existing);
    }

    const topRoutes = Array.from(routeMap.values())
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .slice(0, 5)
      .map((route) => {
        const [topPlane] = Array.from(route.planeWeights.entries()).sort((a, b) => b[1] - a[1])[0] || [];

        return {
          destination: `${route.originCode} → ${route.destCode}`,
          destinationDetail: `${route.originCity}, ${route.originCountry} to ${route.destCity}, ${route.destCountry}`,
          planeId: topPlane || 'N/A',
          totalWeight: `${(route.totalWeight / 1000).toFixed(1)} MT`,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        shipmentMapData,
        topRoutes,
      },
    });
  } catch (err) {
    console.error('[GET /api/dashboard/analytics]', err instanceof Error ? err.message : 'Unexpected error');
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: EMPTY_DASHBOARD_DATA },
      { status: 500 }
    );
  }
}
