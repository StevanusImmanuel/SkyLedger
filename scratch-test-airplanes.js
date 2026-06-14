require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { airplanes, airlines, flights, shipments } = require('./src/lib/db/schema');
const { eq, and, inArray, sql } = require('drizzle-orm');

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client);

async function run() {
  try {
    console.log("Starting test query...");
    const activeWeightSubquery = db
      .select({
        airplaneId: flights.airplaneId,
        totalWeight: sql`SUM(CAST(${shipments.weightKg} AS NUMERIC))`.as('total_weight'),
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
        utilizedWeight: sql`COALESCE(${activeWeightSubquery.totalWeight}, 0)`,
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
