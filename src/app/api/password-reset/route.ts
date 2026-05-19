import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResets } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Generate a secure random token
function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

// POST /api/password-reset?action=request
// Request a password reset (generates token)
export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  try {
    if (action === 'request') {
      const body = await request.json();
      const { email } = body;

      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase().trim()),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return NextResponse.json({
          success: true,
          message: 'If an account exists with that email, a reset link has been generated.',
        });
      }

      // Generate reset token
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing reset tokens for this user
      await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

      // Create new reset token
      await db.insert(passwordResets).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // In production, send email here
      // For development, return the reset link
      const resetLink = `${request.nextUrl.origin}/login/reset-password/${token}`;

      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been generated.',
        // Remove this in production (only for development)
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      });
    }

    if (action === 'reset') {
      const body = await request.json();
      const { token, password } = body;

      if (!token || !password) {
        return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
      }

      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      // Find valid reset token
      const resetRecord = await db.query.passwordResets.findFirst({
        where: and(
          eq(passwordResets.token, token),
          gt(passwordResets.expiresAt, new Date())
        ),
      });

      if (!resetRecord) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update user password
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetRecord.userId));

      // Delete used reset token
      await db.delete(passwordResets).where(eq(passwordResets.id, resetRecord.id));

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now login.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[/api/password-reset]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
