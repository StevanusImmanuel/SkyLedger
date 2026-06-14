import 'dotenv/config';
import { db } from './src/lib/db';
import { shipments } from './src/lib/db/schema';
import { desc } from 'drizzle-orm';

async function run() {
  try {
    console.log("Running shipments query...");
    const rows = await db.query.shipments.findMany({
      with: {
        originAirport: true,
        destAirport: true,
        flight: {
          with: {
            airline: true,
            airplane: true,
          },
        },
        createdByUser: { columns: { id: true, name: true, skyledgerId: true } },
      },
      orderBy: [desc(shipments.createdAt)],
      limit: 10,
    });
    console.log("Success! Rows fetched:", rows.length);
    process.exit(0);
  } catch (error) {
    console.error("Query failed with error:", error);
    process.exit(1);
  }
}

run();
