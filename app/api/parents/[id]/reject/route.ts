import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// REJECT PARENT REGISTRATION API ENDPOINT (MODULE 3)
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher via session cookie.
// 2. Looks up the parent record by unique ID.
// 3. Validates that the account exists and is eligible for rejection.
// 4. Updates status to 'Rejected' and records an optional rejection reason.
// 5. Saves changes to the database and returns a clear success response.
//
// Compliance:
// Enforces Section 10: Prevents accidental or client-side-only status manipulation.
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from session cookies
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to reject registrations.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid parent ID provided.' },
        { status: 400 }
      );
    }

    // Default rejection note when teacher leaves note blank
    let reason = 'Registration rejected by teacher.';
    try {
      const body = await request.json();
      if (body.reason && typeof body.reason === 'string' && body.reason.trim().length > 0) {
        reason = body.reason.trim();
      }
    } catch {
      // Body is optional; default reason will be used
    }

    // ------------------------------------------------------------------------
    // Step 3: Verify that the parent record exists in the database
    // ------------------------------------------------------------------------
    const parent = db
      .prepare('SELECT id, fullName, email, status FROM parents WHERE id = ?')
      .get(id) as {
      id: string;
      fullName: string;
      email: string;
      status: string;
    } | undefined;

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent record not found.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Verify the account status is not already 'Rejected'
    // ------------------------------------------------------------------------
    if (parent.status === 'Rejected') {
      return NextResponse.json(
        { error: 'This parent registration has already been rejected.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Update status to 'Rejected' and record the rejection reason
    // ------------------------------------------------------------------------
    db.prepare(`
      UPDATE parents 
      SET 
        status = 'Rejected',
        rejectionReason = ?,
        teacherId = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).run(reason, teacher.id, id);

    // ------------------------------------------------------------------------
    // Step 6: Return successful rejection response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: `Parent registration for ${parent.fullName} was rejected.`,
      parent: {
        id: parent.id,
        status: 'Rejected',
      },
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error rejecting parent registration:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while rejecting the parent account.' },
      { status: 500 }
    );
  }
}
