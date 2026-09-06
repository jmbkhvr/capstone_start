import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// APPROVE PARENT REGISTRATION API ENDPOINT (MODULE 3)
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher via the session cookie.
// 2. Looks up the parent record by unique ID.
// 3. Validates that the account is currently 'Pending' (rejects already approved accounts).
// 4. Updates the parent's status to 'Approved' and links the approving teacher's ID.
// 5. Saves changes to the database and returns a clear success response.
//
// Compliance:
// Enforces Section 9: Operation is performed strictly through the backend,
// preventing frontend-only status manipulation.
// ============================================================================

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from session cookies
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to approve registrations.' },
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

    // ------------------------------------------------------------------------
    // Step 2: Verify that the parent record exists in the database
    // ------------------------------------------------------------------------
    const parent = db
      .prepare('SELECT id, fullName, email, status, teacherId FROM parents WHERE id = ?')
      .get(id) as {
      id: string;
      fullName: string;
      email: string;
      status: string;
      teacherId: string | null;
    } | undefined;

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent record not found.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Verify the account status is currently 'Pending'
    // ------------------------------------------------------------------------
    if (parent.status === 'Approved') {
      return NextResponse.json(
        { error: 'This parent account has already been approved.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Update status to 'Approved' and associate with the approving teacher
    // ------------------------------------------------------------------------
    db.prepare(`
      UPDATE parents 
      SET 
        status = 'Approved',
        teacherId = ?,
        rejectionReason = NULL,
        updatedAt = datetime('now')
      WHERE id = ?
    `).run(teacher.id, id);

    // ------------------------------------------------------------------------
    // Step 5: Return successful approval response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: `Parent account for ${parent.fullName} approved successfully.`,
      parent: {
        id: parent.id,
        status: 'Approved',
      },
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error approving parent registration:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while approving the parent account.' },
      { status: 500 }
    );
  }
}
