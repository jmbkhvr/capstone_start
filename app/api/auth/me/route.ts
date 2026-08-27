import { NextResponse } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';

// ============================================================================
// CURRENT SESSION VERIFICATION API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles GET requests from client components to verify whether the teacher
// is currently logged in, returning their active profile data.
//
// Why it is needed:
// Allows frontend components (Navigation headers, Dashboard components) to
// dynamically display teacher info and verify authentication state.
// ============================================================================

export async function GET() {
  try {
    // Read and verify incoming request auth cookie.
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      teacher,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, teacher: null },
      { status: 500 }
    );
  }
}
