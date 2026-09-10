import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword, createAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { validateLoginInput } from '@/lib/validation';

// ============================================================================
// TEACHER LOGIN API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles POST requests from the Teacher Login page (/login).
// It validates credentials, looks up the teacher record in the database,
// checks the password hash via bcrypt, and issues an authenticated session token.
//
// Why it is needed:
// Allows registered teachers to authenticate into the system and access protected pages.
//
// Security Behavior:
// - Validates input presence and email formatting on server side.
// - Compares entered password against stored bcrypt hash using constant-time comparison.
// - Returns generic security error messages ("Invalid email or password") to prevent email enumeration.
// - Sets an HTTP-Only session cookie upon successful authentication.
// ============================================================================

export async function POST(request: Request) {
  try {
    // Parse incoming JSON request body.
    const body = await request.json();
    const { email, password } = body;

    // Validate login inputs.
    const validation = validateLoginInput({ email, password });
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errorMessage },
        { status: 400 } // 400 Bad Request
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query teacher record from database by email address.
    const teacher = await db.teacher.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        teacherId: true,
        fullName: true,
        email: true,
        passwordHash: true,
      }
    });

    // If teacher record is not found in database, return safe unauthorized error.
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address or password. Please try again.' },
        { status: 401 } // 401 Unauthorized
      );
    }

    // Verify entered plain-text password against stored bcrypt password hash.
    const isPasswordCorrect = await verifyPassword(password, teacher.passwordHash);

    if (!isPasswordCorrect) {
      // Return same generic message to avoid exposing whether email or password was wrong.
      return NextResponse.json(
        { success: false, message: 'Invalid email address or password. Please try again.' },
        { status: 401 } // 401 Unauthorized
      );
    }

    // Create session payload for authenticated teacher.
    const teacherPayload = {
      id: teacher.id,
      teacherId: teacher.teacherId,
      fullName: teacher.fullName,
      email: teacher.email,
    };

    // Sign JWT token for the authenticated session.
    const token = createAuthToken(teacherPayload);

    // Prepare JSON response object.
    const response = NextResponse.json({
      success: true,
      message: 'Login successful! Redirecting to your dashboard...',
      teacher: teacherPayload,
    });

    // Store JWT token in secure HTTP-Only cookie.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true, // Prevents client JS access (XSS protection)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // Valid for 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    // Log internal error safely.
    console.error('Login server error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred during login. Please try again.',
      },
      { status: 500 }
    );
  }
}
