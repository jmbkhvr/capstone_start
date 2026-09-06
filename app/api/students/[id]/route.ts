import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// SINGLE STUDENT DETAILS & UPDATE API ENDPOINT (MODULE 5)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves complete details of an individual student by unique ID.
//    Enforces data isolation: Teachers can only view students in their own classes.
// 2. PUT: Updates a student's personal info, grade level, assigned classroom,
//    or parent link. Validates ownership over all reassigned relations.
//
// Security Note:
// Teacher A can NEVER view or update Teacher B's students. Requests where
// student.teacherId does not match the session teacher return HTTP 404/403.
// ============================================================================

// ----------------------------------------------------------------------------
// GET: Retrieve a single student's profile details
// ----------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate requesting teacher from session cookie
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to view student details.' },
        { status: 401 }
      );
    }

    // Await params promise in accordance with Next.js 15+ conventions
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid student ID provided.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Query student record owned by this teacher with joined details
    // ------------------------------------------------------------------------
    const student = db
      .prepare(
        `SELECT 
          s.id,
          s.firstName,
          s.middleName,
          s.lastName,
          s.fullName,
          s.gradeLevel,
          s.classroomId,
          s.teacherId,
          s.parentId,
          s.status,
          s.createdAt,
          s.updatedAt,
          c.name as classroomName,
          c.section as classroomSection,
          c.schoolYear as classroomSchoolYear,
          p.fullName as parentName,
          p.email as parentEmail,
          p.contactNumber as parentContact
        FROM students s
        LEFT JOIN classrooms c ON s.classroomId = c.id
        LEFT JOIN parents p ON s.parentId = p.id
        WHERE s.id = ? AND s.teacherId = ?`
      )
      .get(id, teacher.id) as any;

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or you do not have permission to view this student.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Return student response
    // ------------------------------------------------------------------------
    return NextResponse.json({ success: true, student });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error fetching student details:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while retrieving student details.' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// PUT: Update an existing student's information
// ----------------------------------------------------------------------------
export async function PUT(
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
        { error: 'Unauthorized. Please log in as a teacher to edit student information.' },
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
    // Step 2: Verify student exists and belongs to the authenticated teacher
    // ------------------------------------------------------------------------
    const existingStudent = db
      .prepare('SELECT id, classroomId FROM students WHERE id = ? AND teacherId = ?')
      .get(id, teacher.id) as { id: string; classroomId: string } | undefined;

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found or you do not have permission to edit this record.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Parse and sanitize incoming JSON update payload
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

    const {
      firstName,
      middleName = '',
      lastName,
      gradeLevel = 'Grade 3',
      classroomId,
      parentId = null,
    } = body;

    // Validate names
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Student First Name is required (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Student Last Name is required (at least 2 characters).' },
        { status: 400 }
      );
    }

    const targetClassroomId = classroomId || existingStudent.classroomId;

    // ------------------------------------------------------------------------
    // Step 4: Verify classroom belongs to the authenticated teacher
    // ------------------------------------------------------------------------
    const classroom = db
      .prepare('SELECT id, name FROM classrooms WHERE id = ? AND teacherId = ?')
      .get(targetClassroomId, teacher.id);

    if (!classroom) {
      return NextResponse.json(
        { error: 'The selected classroom is invalid or does not belong to your account.' },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Verify parent authorization if parentId is provided
    // ------------------------------------------------------------------------
    let validParentId: string | null = null;
    if (parentId && typeof parentId === 'string' && parentId.trim().length > 0) {
      const parent = db
        .prepare(
          `SELECT id FROM parents 
           WHERE id = ? AND (teacherId = ? OR teacherId IS NULL)`
        )
        .get(parentId.trim(), teacher.id);

      if (!parent) {
        return NextResponse.json(
          { error: 'The selected parent account is invalid or unauthorized.' },
          { status: 403 }
        );
      }
      validParentId = parentId.trim();
    }

    const cleanFirst = firstName.trim();
    const cleanMiddle = (middleName || '').trim();
    const cleanLast = lastName.trim();
    const cleanGrade = (gradeLevel || 'Grade 3').trim();
    const cleanFullName = cleanMiddle
      ? `${cleanFirst} ${cleanMiddle} ${cleanLast}`
      : `${cleanFirst} ${cleanLast}`;

    // ------------------------------------------------------------------------
    // Step 6: Check for duplicate student name conflict in the same classroom
    // ------------------------------------------------------------------------
    const duplicateConflict = db
      .prepare(
        `SELECT id FROM students 
         WHERE teacherId = ? AND classroomId = ? AND LOWER(firstName) = LOWER(?) AND LOWER(lastName) = LOWER(?) AND id != ? AND status = 'Active'`
      )
      .get(teacher.id, targetClassroomId, cleanFirst, cleanLast, id);

    if (duplicateConflict) {
      return NextResponse.json(
        {
          error: `Another active student named "${cleanFirst} ${cleanLast}" already exists in this classroom.`,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 7: Update student record in SQLite
    // ------------------------------------------------------------------------
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE students 
       SET 
         firstName = ?, 
         middleName = ?, 
         lastName = ?, 
         fullName = ?, 
         gradeLevel = ?, 
         classroomId = ?, 
         parentId = ?, 
         updatedAt = ?
       WHERE id = ? AND teacherId = ?`
    ).run(
      cleanFirst,
      cleanMiddle || null,
      cleanLast,
      cleanFullName,
      cleanGrade,
      targetClassroomId,
      validParentId,
      now,
      id,
      teacher.id
    );

    // ------------------------------------------------------------------------
    // Step 8: Fetch updated record
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
    // Step 9: Return success response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: 'Student information updated successfully.',
      student: updatedStudent,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while updating the student.' },
      { status: 500 }
    );
  }
}
