import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

// ============================================================================
// TEACHER LOGOUT API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles POST requests to log out the currently authenticated teacher.
// It invalidates the session by setting maxAge = 0 on the auth cookie.
//
// Why it is needed:
// Ensures teachers can safely terminate their session on shared school computers,
// preventing unauthorized access to protected reading assessment data.
// ============================================================================

export async function POST() {
  try {
    // Create response acknowledging logout request.
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully. Redirecting to login page...',
    });

    // Invalidate session cookie by setting maxAge to 0 and empty value.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expires cookie
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process logout request.' },
      { status: 500 }
    );
  }
}
