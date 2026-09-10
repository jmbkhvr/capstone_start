import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';
import { SUPPORTED_GRADE_LEVELS } from '@/lib/constants';

// ============================================================================
// STUDENT MANAGEMENT LIST & CREATE API ENDPOINT (MODULE 5)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves the student profiles across elementary grades (Grade 1 to 6)
//    belonging exclusively to the authenticated teacher. Supports classroom filtering, status filtering
//    ('All', 'Active', 'Inactive'), and search queries (by student name or parent name).
//    Also returns the teacher's active classrooms and approved parents for dropdowns.
// 2. POST: Validates student fields (first name, last name, classroom, optional parent),
//    verifies teacher authorization over the assigned classroom and parent, prevents
//    duplicate active student registrations, and creates the student record in SQLite.
//
// Security Note:
// Multi-tenant authorization is strictly enforced on the backend. All database
// queries are scoped to the authenticated teacher's unique ID (`teacherId`).
// ============================================================================

// ----------------------------------------------------------------------------
// GET: Retrieve student profiles with search, classroom, and status filtering
// ----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from the session cookie
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to view students.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Parse query parameters from the request URL
    // ------------------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const classroomFilter = (searchParams.get('classroom') || 'All').trim();
    const statusFilter = (searchParams.get('status') || 'All').trim();
    const searchQuery = (searchParams.get('search') || '').trim();



    // ------------------------------------------------------------------------
    // Step 4: Fetch teacher's active classrooms (for filter and add dropdowns)
    // ------------------------------------------------------------------------
    const teacherClassrooms = await db.classroom.findMany({
      where: { teacherId: teacher.id, status: 'Active' },
      select: { id: true, name: true, section: true, gradeLevel: true, schoolYear: true },
      orderBy: { name: 'asc' }
    });

    // ------------------------------------------------------------------------
    // Step 5: Fetch approved parents accessible to this teacher
    // ------------------------------------------------------------------------
    const teacherParents = await db.parent.findMany({
      where: {
        OR: [{ teacherId: teacher.id }, { teacherId: null }],
        status: 'Approved'
      },
      select: { id: true, fullName: true, email: true, childName: true, childSection: true },
      orderBy: { fullName: 'asc' }
    });

    // ------------------------------------------------------------------------
    // Step 6: Compute aggregate status counts for this authenticated teacher
    // ------------------------------------------------------------------------
    const countWhereClause: any = { teacherId: teacher.id };
    if (classroomFilter !== 'All') {
      countWhereClause.classroomId = classroomFilter;
    }
    const countRows = await db.student.groupBy({
      by: ['status'],
      where: countWhereClause,
      _count: { _all: true }
    });

    const counts = { all: 0, active: 0, inactive: 0 };
    for (const row of countRows) {
      const lower = row.status.toLowerCase();
      if (lower === 'active') counts.active = row._count._all;
      else if (lower === 'inactive') counts.inactive = row._count._all;
      counts.all += row._count._all;
    }

    // ------------------------------------------------------------------------
    // Step 7: Construct parameterized Prisma query for students with joins
    // ------------------------------------------------------------------------
    const whereClause: any = { teacherId: teacher.id };

    if (classroomFilter !== 'All') {
      whereClause.classroomId = classroomFilter;
    }

    if (statusFilter !== 'All') {
      whereClause.status = statusFilter;
    }

    if (searchQuery.length > 0) {
      whereClause.AND = [
        {
          OR: [
            { fullName: { contains: searchQuery, mode: 'insensitive' } },
            { firstName: { contains: searchQuery, mode: 'insensitive' } },
            { lastName: { contains: searchQuery, mode: 'insensitive' } },
            {
              parent: {
                fullName: { contains: searchQuery, mode: 'insensitive' }
              }
            }
          ]
        }
      ];
    }

    const students = await db.student.findMany({
      where: whereClause,
      include: {
        classroom: {
          select: { name: true, section: true, schoolYear: true }
        },
        parent: {
          select: { fullName: true, email: true, contactNumber: true }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    const formattedStudents = students.map((s) => {
      const { classroom, parent, ...rest } = s;
      return {
        ...rest,
        classroomName: classroom?.name || null,
        classroomSection: classroom?.section || null,
        classroomSchoolYear: classroom?.schoolYear || null,
        parentName: parent?.fullName || null,
        parentEmail: parent?.email || null,
        parentContact: parent?.contactNumber || null,
      };
    });

    // ------------------------------------------------------------------------
    // Step 8: Return formatted response payload
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      students: formattedStudents,
      counts,
      classrooms: teacherClassrooms,
      parents: teacherParents,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe error message
    // ------------------------------------------------------------------------
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while retrieving students.' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// POST: Add a new student assigned to the teacher's classroom
// ----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from session cookies
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to add a student.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Parse and sanitize incoming JSON payload
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

    // ------------------------------------------------------------------------
    // Step 3: Validate required pupil fields
    // ------------------------------------------------------------------------
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

    if (!classroomId || typeof classroomId !== 'string') {
      return NextResponse.json(
        { error: 'Please select an authorized classroom for this student.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Verify the selected classroom belongs to the authenticated teacher
    // ------------------------------------------------------------------------
    const classroom = await db.classroom.findUnique({
      where: { id: classroomId, teacherId: teacher.id },
      select: { id: true, name: true, status: true, gradeLevel: true }
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'The selected classroom does not exist or does not belong to your account.' },
        { status: 403 }
      );
    }

    // Validate Grade Level:
    // If explicitly provided, must be in SUPPORTED_GRADE_LEVELS.
    // If omitted, dynamically inherit from the selected classroom's grade level.
    const candidateGrade = (gradeLevel || classroom.gradeLevel || '').trim();
    if (!candidateGrade || !SUPPORTED_GRADE_LEVELS.includes(candidateGrade as any)) {
      return NextResponse.json(
        { error: `Grade Level is required and must be one of: ${SUPPORTED_GRADE_LEVELS.join(', ')}.` },
        { status: 400 }
      );
    }

    const cleanFirst = firstName.trim();
    const cleanMiddle = (middleName || '').trim();
    const cleanLast = lastName.trim();
    const cleanGrade = candidateGrade;
    const cleanFullName = cleanMiddle
      ? `${cleanFirst} ${cleanMiddle} ${cleanLast}`
      : `${cleanFirst} ${cleanLast}`;

    if (classroom.status === 'Archived') {
      return NextResponse.json(
        { error: 'Cannot add students to an archived classroom. Please choose an active classroom.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Verify parent authorization if a parentId was provided
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

    // ------------------------------------------------------------------------
    // Step 6: Prevent duplicate active student in the same classroom
    // ------------------------------------------------------------------------
    const duplicateStudent = await db.student.findFirst({
      where: {
        teacherId: teacher.id,
        classroomId: classroomId,
        firstName: { equals: cleanFirst, mode: 'insensitive' },
        lastName: { equals: cleanLast, mode: 'insensitive' },
        status: 'Active'
      },
      select: { id: true }
    });

    if (duplicateStudent) {
      return NextResponse.json(
        {
          error: `An active student named "${cleanFirst} ${cleanLast}" already exists in "${classroom.name}".`,
        },
        { status: 409 }
      );
    }

    const newStudent = await db.student.create({
      data: {
        firstName: cleanFirst,
        middleName: cleanMiddle || null,
        lastName: cleanLast,
        fullName: cleanFullName,
        gradeLevel: cleanGrade,
        classroomId: classroomId,
        teacherId: teacher.id,
        parentId: validParentId,
        status: 'Active'
      },
      include: {
        classroom: { select: { name: true } },
        parent: { select: { fullName: true } }
      }
    });

    const formattedNewStudent = {
      ...newStudent,
      classroomName: newStudent.classroom?.name || null,
      parentName: newStudent.parent?.fullName || null
    };

    // ------------------------------------------------------------------------
    // Step 9: Return success response with HTTP 201 Created
    // ------------------------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: 'Student profile created successfully.',
        student: formattedNewStudent,
      },
      { status: 201 }
    );
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while creating the student.' },
      { status: 500 }
    );
  }
}
