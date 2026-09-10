import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// ARCHIVE / RESTORE CLASSROOM API ENDPOINT (MODULE 4)
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher.
// 2. Verifies the classroom exists and is owned by the authenticated teacher.
// 3. Toggles or sets the classroom status to 'Archived' (or restores to 'Active').
//
// Archiving Decision Rationale (Section 10):
// In accordance with Section 10, soft archiving (`status = 'Archived'`) is chosen
// over hard deletion to prevent the permanent loss of student assignment records
// and subsequent reading assessment scores. Archived classrooms can also be
// restored if archived by mistake.
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate requesting teacher from session cookie
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to manage classroom status.' },
        { status: 401 }
      );
    }

    // Await params promise
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid classroom ID provided.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Look up classroom record owned by this teacher
    // ------------------------------------------------------------------------
    const classroom = await db.classroom.findUnique({
      where: { id: id, teacherId: teacher.id },
      select: { id: true, name: true, status: true }
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found or you do not have permission to modify it.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Determine target status (Archive or Restore)
    // ------------------------------------------------------------------------
    let targetStatus: 'Archived' | 'Active' = 'Archived';

    try {
      const body = await request.json();
      if (body?.action === 'restore' || body?.status === 'Active') {
        targetStatus = 'Active';
      } else if (body?.action === 'archive' || body?.status === 'Archived') {
        targetStatus = 'Archived';
      }
    } catch {
      // If request has no JSON body, default to toggling or archiving
      targetStatus = classroom.status === 'Archived' ? 'Active' : 'Archived';
    }

    // Check if already in the desired status
    if (classroom.status === targetStatus) {
      return NextResponse.json(
        {
          error: `Classroom "${classroom.name}" is already ${targetStatus.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Update status in database
    // ------------------------------------------------------------------------
    const updatedClassroom = await db.classroom.update({
      where: { id: id, teacherId: teacher.id },
      data: { status: targetStatus }
    });

    const message =
      targetStatus === 'Archived'
        ? `Classroom "${classroom.name}" archived successfully.`
        : `Classroom "${classroom.name}" restored to active status successfully.`;

    // ------------------------------------------------------------------------
    // Step 6: Return response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      message,
      classroom: {
        ...updatedClassroom,
        teacherName: teacher.fullName,
      },
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error modifying classroom archive status:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while updating classroom status.' },
      { status: 500 }
    );
  }
}
