import { NextResponse } from 'next/server';
import db from '@/lib/db';

// ============================================================================
// VERIFY RESET TOKEN API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles GET requests to verify whether a password reset token from a link URL
// is valid, unused, and unexpired before displaying the Reset Password form.
//
// Why it is needed:
// Allows the client UI to immediately warn teachers if they clicked an expired,
// invalid, or previously consumed password reset link.
// ============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Missing password reset token.' },
        { status: 400 }
      );
    }

    // Query passwordReset table by token.
    const resetRecord = await db.passwordReset.findUnique({
      where: { token: token.trim() },
      select: {
        id: true,
        teacherId: true,
        email: true,
        expiresAt: true,
        used: true,
      }
    });

    // Check if token exists in database.
    if (!resetRecord) {
      return NextResponse.json(
        { valid: false, message: 'This password reset link is invalid or does not exist.' },
        { status: 400 }
      );
    }

    // Check if token has already been used.
    if (resetRecord.used === 1) {
      return NextResponse.json(
        { valid: false, message: 'This password reset link has already been used.' },
        { status: 400 }
      );
    }

    // Check if token has expired.
    const expirationTime = new Date(resetRecord.expiresAt).getTime();
    if (expirationTime < Date.now()) {
      return NextResponse.json(
        { valid: false, message: 'This password reset link has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // Token is valid and ready to be used.
    return NextResponse.json({
      valid: true,
      email: resetRecord.email,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { valid: false, message: 'An unexpected server error occurred while verifying the reset token.' },
      { status: 500 }
    );
  }
}
