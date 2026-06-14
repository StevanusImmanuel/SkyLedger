import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '../src/lib/db/migrations');

const sql = neon(process.env.DATABASE_URL);

const pendingFiles = [
  '0002_add_delivery_status.sql',
  '0003_add_airport_coordinates.sql',
  '0004_add_closed_status.sql',
  '0005_add_airplane_capacity.sql',
];

for (const file of pendingFiles) {
  try {
    const content = readFileSync(join(migrationsDir, file), 'utf-8');
    const statements = content.split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) {
      await sql.query(statement);
    }
    console.log(`✓ ${file}`);
  } catch (err) {
    if (err.message?.includes('already exists') || err.message?.includes('does not exist')) {
      console.log(`~ ${file} (skipped — already applied or n/a)`);
    } else {
      console.error(`✗ ${file}:`, err.message);
    }
  }
}

console.log('Done.');
