import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';
import { SUPPORTED_GRADE_LEVELS } from '@/lib/constants';

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
    const student = await db.student.findUnique({
      where: { id: id, teacherId: teacher.id },
      include: {
        classroom: {
          select: { name: true, section: true, schoolYear: true }
        },
        parent: {
          select: { fullName: true, email: true, contactNumber: true }
        }
      }
    });

    let formattedStudent = null;
    if (student) {
      const { classroom, parent, ...rest } = student;
      formattedStudent = {
        ...rest,
        classroomName: classroom?.name || null,
        classroomSection: classroom?.section || null,
        classroomSchoolYear: classroom?.schoolYear || null,
        parentName: parent?.fullName || null,
        parentEmail: parent?.email || null,
        parentContact: parent?.contactNumber || null,
      };
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or you do not have permission to view this student.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Return student response
    // ------------------------------------------------------------------------
    return NextResponse.json({ success: true, student: formattedStudent });
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
    const existingStudent = await db.student.findUnique({
      where: { id: id, teacherId: teacher.id },
      select: { id: true, classroomId: true, gradeLevel: true }
    });

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
      gradeLevel,
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
    const classroom = await db.classroom.findUnique({
      where: { id: targetClassroomId, teacherId: teacher.id },
      select: { id: true, name: true }
    });

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
      const parent = await db.parent.findFirst({
        where: {
          id: parentId.trim(),
          OR: [{ teacherId: teacher.id }, { teacherId: null }]
        },
        select: { id: true }
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'The selected parent account is invalid or unauthorized.' },
          { status: 403 }
        );
      }
      validParentId = parentId.trim();
    }

    // Validate Grade Level: Ensure it is one of the supported elementary grades
    const cleanGrade = (gradeLevel || existingStudent.gradeLevel || '').trim();
    if (!cleanGrade || !SUPPORTED_GRADE_LEVELS.includes(cleanGrade as any)) {
      return NextResponse.json(
        { error: `Grade Level is required and must be one of: ${SUPPORTED_GRADE_LEVELS.join(', ')}.` },
        { status: 400 }
      );
    }

    const cleanFirst = firstName.trim();
    const cleanMiddle = (middleName || '').trim();
    const cleanLast = lastName.trim();
    const cleanFullName = cleanMiddle
      ? `${cleanFirst} ${cleanMiddle} ${cleanLast}`
      : `${cleanFirst} ${cleanLast}`;

    // ------------------------------------------------------------------------
    // Step 6: Check for duplicate student name conflict in the same classroom
    // ------------------------------------------------------------------------
    const duplicateConflict = await db.student.findFirst({
      where: {
        teacherId: teacher.id,
        classroomId: targetClassroomId,
        firstName: { equals: cleanFirst, mode: 'insensitive' },
        lastName: { equals: cleanLast, mode: 'insensitive' },
        id: { not: id },
        status: 'Active'
      },
      select: { id: true }
    });

    if (duplicateConflict) {
      return NextResponse.json(
        {
          error: `Another active student named "${cleanFirst} ${cleanLast}" already exists in this classroom.`,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 7: Update student record in PostgreSQL
    // ------------------------------------------------------------------------
    const updatedStudent = await db.student.update({
      where: { id: id, teacherId: teacher.id },
      data: {
        firstName: cleanFirst,
        middleName: cleanMiddle || null,
        lastName: cleanLast,
        fullName: cleanFullName,
        gradeLevel: cleanGrade,
        classroomId: targetClassroomId,
        parentId: validParentId,
      },
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
    // Step 9: Return success response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: 'Student information updated successfully.',
      student: formattedUpdatedStudent,
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
