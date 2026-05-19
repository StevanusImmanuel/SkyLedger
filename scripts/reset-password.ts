import 'dotenv/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';

async function resetPassword() {
  const email = 'admin@skyledger.com';
  const newPassword = 'admin123';

  console.log('Resetting password for:', email);
  console.log('New password:', newPassword);

  const passwordHash = await hashPassword(newPassword);

  const [updated] = await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ email: users.email, name: users.name });

  if (updated) {
    console.log('✅ Password reset successful!');
    console.log('User:', updated.name);
    console.log('Email:', updated.email);
    console.log('Password:', newPassword);
    console.log('\nYou can now login at: http://localhost:3000/login/auth');
  } else {
    console.log('❌ User not found');
  }

  process.exit(0);
}

resetPassword().catch(console.error);
