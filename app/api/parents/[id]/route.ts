import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// SINGLE PARENT RECORD DETAILS API ENDPOINT
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher.
// 2. Looks up an individual parent record by its unique database UUID string.
// 3. Verifies authorization (ensuring teacher has permission to view this parent).
// 4. Returns complete parent details, linked Grade 3 child info, and account status.
//
// Security Note:
// The passwordHash field is deliberately excluded from the SELECT query.
// ============================================================================

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from the session cookie
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to view parent details.' },
        { status: 401 }
      );
    }

    // Await params promise in accordance with Next.js 15+ conventions
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid parent ID provided.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Query the parent record by unique ID
    // ------------------------------------------------------------------------
    const parent = await db.parent.findFirst({
      where: {
        id: id,
        OR: [
          { teacherId: teacher.id },
          { teacherId: null }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        contactNumber: true,
        childName: true,
        childGradeLevel: true,
        childSection: true,
        teacherId: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent record not found or you do not have permission to view it.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Return parent details response
    // ------------------------------------------------------------------------
    return NextResponse.json({ parent });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error fetching parent details:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while retrieving parent details.' },
      { status: 500 }
    );
  }
}
