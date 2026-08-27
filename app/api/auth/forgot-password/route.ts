import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { validateForgotPasswordInput } from '@/lib/validation';
import { sendPasswordResetEmail } from '@/lib/email';

// ============================================================================
// FORGOT PASSWORD API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles POST requests from the Forgot Password page (/forgot-password).
// It validates the submitted email, checks if a registered teacher exists,
// generates a secure random 64-character token with a 1-hour expiration time,
// saves the reset request to the 'password_resets' database table, and
// dispatches/logs the reset link.
//
// Why it is needed:
// Allows teachers who forgot their password to initiate a password recovery flow.
//
// Security Behavior:
// - Validates email format on the server.
// - Protects against account enumeration by returning the same generic success
//   message regardless of whether the email address exists in the database.
// - Generates cryptographically strong random tokens (crypto.randomBytes).
// - Enforces a 1-hour expiration limit on generated tokens.
// ============================================================================

export async function POST(request: Request) {
  try {
    // Parse incoming JSON body.
    const body = await request.json();
    const { email } = body;

    // Validate email format.
    const validation = validateForgotPasswordInput(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errorMessage },
        { status: 400 } // 400 Bad Request
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query teacher database for matching account.
    const teacher = db
      .prepare('SELECT id, fullName, email FROM teachers WHERE email = ?')
      .get(cleanEmail) as { id: string; fullName: string; email: string } | undefined;

    // Generic security message returned to user.
    const genericSuccessResponse = NextResponse.json({
      success: true,
      message: 'If an account is associated with that email address, a password reset link has been sent. Please check your inbox.',
    });

    // If teacher is not found, return generic success message immediately (prevents email enumeration).
    if (!teacher) {
      return genericSuccessResponse;
    }

    // Generate secure 64-character hex token.
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration timestamp (1 hour from now).
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Generate new UUID for password reset record.
    const resetId = uuidv4();

    // Insert reset request into password_resets table.
    const insertStatement = db.prepare(`
      INSERT INTO password_resets (id, teacherId, email, token, expiresAt, used)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    insertStatement.run(resetId, teacher.id, cleanEmail, resetToken, expiresAt);

    // Build reset URL pointing to /reset-password page.
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send or log reset link.
    await sendPasswordResetEmail(cleanEmail, resetUrl);

    return genericSuccessResponse;
  } catch (error) {
    console.error('Forgot Password server error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
