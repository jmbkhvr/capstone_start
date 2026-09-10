import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// MOVE STUDENT TO ANOTHER CLASSROOM API ENDPOINT (MODULE 5)
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher.
// 2. Verifies the student belongs to this teacher.
// 3. Verifies the destination classroom belongs to this teacher and is Active.
// 4. Checks for duplicate student naming conflicts in the destination classroom.
// 5. Updates the student's classroom assignment and records the change.
//
// Security Note:
// Prevents cross-teacher movement: Teachers can only move students between
// classrooms that they personally own. Moving a student into another teacher's
// classroom is rejected with HTTP 403 Forbidden.
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
        { error: 'Unauthorized. Please log in as a teacher to reassign student classroom.' },
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
    // Step 2: Verify student exists and belongs to authenticated teacher
    // ------------------------------------------------------------------------
    const student = await db.student.findUnique({
      where: { id: id, teacherId: teacher.id },
      select: { id: true, firstName: true, lastName: true, fullName: true, classroomId: true }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or you do not have permission to modify this student.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Parse and validate newClassroomId
    // ------------------------------------------------------------------------
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const targetClassroomId =
      typeof body.newClassroomId === 'string' && body.newClassroomId.trim()
        ? body.newClassroomId.trim()
        : typeof body.classroomId === 'string' && body.classroomId.trim()
        ? body.classroomId.trim()
        : '';

    if (!targetClassroomId) {
      return NextResponse.json(
        { error: 'Please select a destination classroom.' },
        { status: 400 }
      );
    }

    if (targetClassroomId === student.classroomId) {
      return NextResponse.json(
        { error: 'The student is already assigned to this classroom.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Verify destination classroom belongs to authenticated teacher
    // ------------------------------------------------------------------------
    const destinationClassroom = await db.classroom.findUnique({
      where: { id: targetClassroomId, teacherId: teacher.id },
      select: { id: true, name: true, status: true }
    });

    if (!destinationClassroom) {
      return NextResponse.json(
        { error: 'The destination classroom does not exist or does not belong to your account.' },
        { status: 403 }
      );
    }

    if (destinationClassroom.status === 'Archived') {
      return NextResponse.json(
        { error: 'Cannot move student to an archived classroom.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Check for duplicate student name in destination classroom
    // ------------------------------------------------------------------------
    const duplicateInDest = await db.student.findFirst({
      where: {
        teacherId: teacher.id,
        classroomId: targetClassroomId,
        firstName: { equals: student.firstName, mode: 'insensitive' },
        lastName: { equals: student.lastName, mode: 'insensitive' },
        status: 'Active'
      },
      select: { id: true }
    });

    if (duplicateInDest) {
      return NextResponse.json(
        {
          error: `An active student named "${student.fullName}" already exists in "${destinationClassroom.name}".`,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 6: Update classroom assignment in database
    // ------------------------------------------------------------------------
    const updatedStudent = await db.student.update({
      where: { id: id, teacherId: teacher.id },
      data: { classroomId: targetClassroomId },
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

    // ------------------------------------------------------------------------
    // Step 8: Return success response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: `Student "${student.fullName}" moved to "${destinationClassroom.name}" successfully.`,
      student: formattedUpdatedStudent,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error moving student to another classroom:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while moving the student.' },
      { status: 500 }
    );
  }
}
