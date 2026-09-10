import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// STUDENT DEACTIVATION & STATUS TOGGLE API ENDPOINT (MODULE 5)
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher.
// 2. Verifies the student belongs to the teacher.
// 3. Updates the student's lifecycle status between 'Active' and 'Inactive'.
//
// Soft Deactivation Rationale (Section 15):
// Permanent deletion is strictly avoided to preserve historical reading assessment
// logs, speech-recognition accuracy metrics, and pupil progress history.
// Deactivating a student marks them as 'Inactive' (soft archival) without destroying data.
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
        { error: 'Unauthorized. Please log in as a teacher to update student status.' },
        { status: 401 }
      );
    }

    // Await params promise
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid student ID provided.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Verify student exists and belongs to this teacher
    // ------------------------------------------------------------------------
    const student = await db.student.findUnique({
      where: { id: id, teacherId: teacher.id },
      select: { id: true, fullName: true, status: true }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or you do not have permission to modify this record.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Determine target status ('Inactive' or 'Active')
    // ------------------------------------------------------------------------
    let targetStatus: 'Inactive' | 'Active' = 'Inactive';

    try {
      const body = await request.json();
      if (body?.action === 'activate' || body?.status === 'Active') {
        targetStatus = 'Active';
      } else if (body?.action === 'deactivate' || body?.status === 'Inactive') {
        targetStatus = 'Inactive';
      }
    } catch {
      // Default to toggling
      targetStatus = student.status === 'Inactive' ? 'Active' : 'Inactive';
    }

    if (student.status === targetStatus) {
      return NextResponse.json(
        { error: `Student "${student.fullName}" is already ${targetStatus.toLowerCase()}.` },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Update status in database
    // ------------------------------------------------------------------------
    const updatedStudent = await db.student.update({
      where: { id: id, teacherId: teacher.id },
      data: { status: targetStatus },
      include: {
        classroom: { select: { name: true } },
        parent: { select: { fullName: true } }
      }
    });

    const formattedUpdatedStudent = {
      ...updatedStudent,
      classroomName: updatedStudent.classroom?.name || null,
      parentName: updatedStudent.parent?.fullName || null
    };

    const message =
      targetStatus === 'Inactive'
        ? `Student "${student.fullName}" deactivated successfully.`
        : `Student "${student.fullName}" reactivated successfully.`;

    // ------------------------------------------------------------------------
    // Step 6: Return response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message,
      student: formattedUpdatedStudent,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error modifying student status:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while updating student status.' },
      { status: 500 }
    );
  }
}
