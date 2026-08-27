import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { validateResetPasswordInput } from '@/lib/validation';

// ============================================================================
// RESET PASSWORD API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles POST requests to reset a teacher's password using a valid reset token.
// It validates inputs, checks token validity and expiration in the database,
// hashes the new password with bcryptjs, updates the teacher's record, and
// marks the token as used so it cannot be reused.
//
// Why it is needed:
// Completes the password recovery process safely.
//
// Security Behavior:
// - Re-verifies token presence, usage status (used == 0), and expiration on backend.
// - Re-validates password strength (min 8 chars) and password confirmation match.
// - Hashes the new password using bcryptjs before updating database.
// - Invalidates the reset token immediately upon successful password update.
// ============================================================================

export async function POST(request: Request) {
  try {
    // Parse incoming JSON body.
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validate inputs.
    const validation = validateResetPasswordInput({ token, password, confirmPassword });
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errorMessage },
        { status: 400 } // 400 Bad Request
      );
    }

    const cleanToken = token.trim();

    // Retrieve matching reset token record from database.
    const resetRecord = db
      .prepare('SELECT id, teacherId, email, expiresAt, used FROM password_resets WHERE token = ?')
      .get(cleanToken) as {
      id: string;
      teacherId: string;
      email: string;
      expiresAt: string;
      used: number;
    } | undefined;

    // Reject if token is not found in database.
    if (!resetRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'This password reset link is invalid or has expired. Please request a new password reset link.',
        },
        { status: 400 }
      );
    }

    // Reject if token has already been consumed.
    if (resetRecord.used === 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'This password reset link has already been used. Please request a new password reset link.',
        },
        { status: 400 }
      );
    }

    // Reject if token has expired.
    const expirationTime = new Date(resetRecord.expiresAt).getTime();
    if (expirationTime < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: 'This password reset link has expired. Please request a new password reset link.',
        },
        { status: 400 }
      );
    }

    // Hash the new plain-text password using bcryptjs.
    const newPasswordHash = await hashPassword(password);

    // Update teacher's password hash in teachers table.
    const updateTeacher = db.prepare(`
      UPDATE teachers
      SET passwordHash = ?, updatedAt = datetime('now')
      WHERE id = ?
    `);

    updateTeacher.run(newPasswordHash, resetRecord.teacherId);

    // Mark password reset token as used (consumed).
    const updateToken = db.prepare(`
      UPDATE password_resets
      SET used = 1
      WHERE id = ?
    `);

    updateToken.run(resetRecord.id);

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in using your new password.',
    });
  } catch (error) {
    console.error('Reset password server error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred while resetting your password. Please try again.',
      },
      { status: 500 }
    );
  }
}
