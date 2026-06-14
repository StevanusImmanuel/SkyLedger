import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, sessions } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function run() {
  try {
    console.log("Fetching users count...");
    const allUsers = await db.select().from(users).limit(5);
    console.log("Users in DB:", allUsers.length);
    console.log("Users samples:", allUsers);

    console.log("Fetching sessions count...");
    const allSessions = await db.select().from(sessions).limit(5);
    console.log("Sessions in DB:", allSessions.length);
    console.log("Sessions samples:", allSessions);
    
    process.exit(0);
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  }
}

run();
