import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or POSTGRES_URL is required.');
  process.exit(1);
}

const sql = neon(databaseUrl);

const files = [
  resolve(rootDir, 'src/lib/db/migrations/0003_add_airport_coordinates.sql'),
  resolve(rootDir, 'scripts/backfill-airport-coordinates.sql'),
];

function readStatements(filePath) {
  return readFileSync(filePath, 'utf8')
    .replaceAll('--> statement-breakpoint', '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function normalize(statement) {
  return statement.replace(/\s+/g, ' ').trim();
}

function isAllowedAlter(statement) {
  return /^ALTER TABLE "airports" ADD COLUMN IF NOT EXISTS "(latitude|longitude)" numeric\(9,\s*6\)$/i.test(
    normalize(statement)
  );
}

function isAllowedBackfillUpdate(statement) {
  const normalized = normalize(statement);

  return (
    normalized.startsWith('UPDATE "airports" SET ') &&
    normalized.includes('"latitude" = COALESCE(') &&
    normalized.includes('"longitude" = COALESCE(') &&
    normalized.includes('WHERE "iata_code" IN (')
  );
}

async function run() {
  let executed = 0;

  for (const filePath of files) {
    const statements = readStatements(filePath);

    for (const statement of statements) {
      if (!isAllowedAlter(statement) && !isAllowedBackfillUpdate(statement)) {
        console.log(`Skipped non-migration statement from ${filePath}: ${normalize(statement).slice(0, 80)}`);
        continue;
      }

      console.log(`Running: ${normalize(statement).slice(0, 100)}...`);
      await sql.query(statement);
      executed += 1;
    }
  }

  console.log(`Airport coordinate migration/backfill complete. Statements executed: ${executed}`);
}

run().catch((error) => {
  console.error('Airport coordinate migration/backfill failed.');
  console.error(error);
  process.exit(1);
});
