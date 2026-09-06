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
    const student = db
      .prepare(
        `SELECT id, firstName, lastName, fullName, classroomId 
         FROM students 
         WHERE id = ? AND teacherId = ?`
      )
      .get(id, teacher.id) as {
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      classroomId: string;
    } | undefined;

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
    const destinationClassroom = db
      .prepare(
        `SELECT id, name, status 
         FROM classrooms 
         WHERE id = ? AND teacherId = ?`
      )
      .get(targetClassroomId, teacher.id) as {
      id: string;
      name: string;
      status: string;
    } | undefined;

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
    const duplicateInDest = db
      .prepare(
        `SELECT id FROM students 
         WHERE teacherId = ? AND classroomId = ? AND LOWER(firstName) = LOWER(?) AND LOWER(lastName) = LOWER(?) AND status = 'Active'`
      )
      .get(teacher.id, targetClassroomId, student.firstName, student.lastName);

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
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE students 
       SET classroomId = ?, updatedAt = ? 
       WHERE id = ? AND teacherId = ?`
    ).run(targetClassroomId, now, id, teacher.id);

    // ------------------------------------------------------------------------
    // Step 7: Fetch updated student record
    // ------------------------------------------------------------------------
    const updatedStudent = db
      .prepare(
        `SELECT 
          s.*,
          c.name as classroomName,
          p.fullName as parentName
         FROM students s
         LEFT JOIN classrooms c ON s.classroomId = c.id
         LEFT JOIN parents p ON s.parentId = p.id
         WHERE s.id = ?`
      )
      .get(id) as any;

    // ------------------------------------------------------------------------
    // Step 8: Return success response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: `Student "${student.fullName}" moved to "${destinationClassroom.name}" successfully.`,
      student: updatedStudent,
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
