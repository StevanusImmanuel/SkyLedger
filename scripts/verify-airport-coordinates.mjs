import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or POSTGRES_URL is required.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function verify() {
  const rows = await sql`
    SELECT id, iata_code, name, latitude, longitude
    FROM airports
    ORDER BY iata_code
  `;

  console.table(rows);

  const missing = rows.filter((row) => row.latitude === null || row.longitude === null);

  if (missing.length > 0) {
    console.log('Airports still missing coordinates:');
    console.table(missing.map(({ id, iata_code, name }) => ({ id, iata_code, name })));
    process.exitCode = 1;
    return;
  }

  console.log('All airports have latitude and longitude.');
}

verify().catch((error) => {
  console.error('Airport coordinate verification failed.');
  console.error(error);
  process.exit(1);
});
