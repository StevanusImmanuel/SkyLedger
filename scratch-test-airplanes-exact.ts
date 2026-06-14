import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { airplanes, airlines, flights, shipments } from './src/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function run() {
  try {
    console.log("Starting exact test query...");
    const activeWeightSubquery = db
      .select({
        airplaneId: flights.airplaneId,
        totalWeight: sql<number>`SUM(CAST(${shipments.weightKg} AS NUMERIC))`,
      })
      .from(shipments)
      .innerJoin(flights, eq(shipments.flightId, flights.id))
      .where(
        and(
          inArray(flights.status, ['scheduled', 'departed']),
          inArray(shipments.status, ['pending', 'processing', 'in_transit'])
        )
      )
      .groupBy(flights.airplaneId)
      .as('aw');

    const query = db
      .select({
        airplaneId: airplanes.airplaneId,
        flightNumber: airplanes.flightNumber,
        model: airplanes.model,
        capacity: airplanes.capacity,
        maxWeightKg: airplanes.maxWeightKg,
        maxVolumeM3: airplanes.maxVolumeM3,
        airlineId: airplanes.airlineId,
        airlineName: airlines.airlineName,
        airlineCode: airlines.airlineCode,
        utilizedWeight: sql<number>`COALESCE(${activeWeightSubquery.totalWeight}, 0)`,
      })
      .from(airplanes)
      .leftJoin(airlines, eq(airplanes.airlineId, airlines.airlineId))
      .leftJoin(activeWeightSubquery, eq(airplanes.airplaneId, activeWeightSubquery.airplaneId));

    console.log("SQL query generated:", query.toSQL());
    const res = await query;
    console.log("Query completed successfully. Count:", res.length);
    console.log("Data sample:", res.slice(0, 2));
    process.exit(0);
  } catch (error) {
    console.error("Query failed with error:", error);
    process.exit(1);
  }
}

run();
