import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';
import { SUPPORTED_GRADE_LEVELS } from '@/lib/constants';

// ============================================================================
// SINGLE CLASSROOM DETAILS & UPDATE API ENDPOINT (MODULE 4)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves the details of a single classroom by its unique ID.
//    Enforces data ownership: Teachers can only access their own classrooms.
// 2. PUT: Validates submitted changes and updates classroom information
//    (name, grade level, section, school year, description).
//
// Security Note:
// Teacher A can NEVER view or update Teacher B's classroom. Requests where
// classroom.teacherId does not match the session teacher return HTTP 404/403.
// ============================================================================

// ----------------------------------------------------------------------------
// GET: Retrieve a single classroom's details
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
        { error: 'Unauthorized. Please log in as a teacher to view classroom details.' },
        { status: 401 }
      );
    }

    // Await params promise in accordance with Next.js 15+ App Router rules
    const { id } = await context.params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid classroom ID provided.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Query classroom record strictly owned by this teacher
    // ------------------------------------------------------------------------
    const classroom = await db.classroom.findUnique({
      where: {
        id: id,
        teacherId: teacher.id
      },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found or you do not have permission to view it.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Check student count (prepared for Module 5: Student Management)
    // ------------------------------------------------------------------------
    const studentCount = classroom._count.students;
    const { _count, ...classroomData } = classroom;

    // ------------------------------------------------------------------------
    // Step 4: Return classroom details response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      classroom: {
        ...classroomData,
        studentCount,
        teacherName: teacher.fullName,
      },
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error fetching classroom details:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while retrieving classroom details.' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// PUT: Update an existing classroom's information
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
        { error: 'Unauthorized. Please log in as a teacher to edit a classroom.' },
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
    // Step 2: Verify classroom exists and belongs to the authenticated teacher
    // ------------------------------------------------------------------------
    const existingClassroom = await db.classroom.findUnique({
      where: { id: id, teacherId: teacher.id },
      select: { id: true, status: true }
    });

    if (!existingClassroom) {
      return NextResponse.json(
        { error: 'Classroom not found or you do not have permission to edit it.' },
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

    const { name, gradeLevel, section, schoolYear, description } = body;

    // Validate Classroom Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Classroom Name is required and must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Classroom Name cannot exceed 100 characters.' },
        { status: 400 }
      );
    }

    // Validate School Year
    if (!schoolYear || typeof schoolYear !== 'string' || schoolYear.trim().length < 4) {
      return NextResponse.json(
        { error: 'School Year is required (e.g., 2026-2027).' },
        { status: 400 }
      );
    }

    // Validate Grade Level: Ensure it matches an allowed elementary grade (Grade 1-6)
    const cleanGradeLevel = (gradeLevel || '').trim();
    if (!cleanGradeLevel || !SUPPORTED_GRADE_LEVELS.includes(cleanGradeLevel as any)) {
      return NextResponse.json(
        {
          error: `Grade Level is required and must be one of: ${SUPPORTED_GRADE_LEVELS.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanSection = (section || '').trim();
    const cleanSchoolYear = schoolYear.trim();
    const cleanDescription = (description || '').trim();

    // ------------------------------------------------------------------------
    // Step 4: Check if new name conflicts with another active classroom of this teacher
    // ------------------------------------------------------------------------
    const duplicateConflict = await db.classroom.findFirst({
      where: {
        teacherId: teacher.id,
        name: { equals: cleanName, mode: 'insensitive' },
        schoolYear: cleanSchoolYear,
        id: { not: id },
        status: 'Active'
      },
      select: { id: true }
    });

    if (duplicateConflict) {
      return NextResponse.json(
        {
          error: `Another active classroom named "${cleanName}" already exists for school year ${cleanSchoolYear}.`,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Update database record
    // ------------------------------------------------------------------------
    const updatedClassroom = await db.classroom.update({
      where: { id: id, teacherId: teacher.id },
      data: {
        name: cleanName,
        gradeLevel: cleanGradeLevel,
        section: cleanSection || null,
        schoolYear: cleanSchoolYear,
        description: cleanDescription || null,
      }
    });

    // ------------------------------------------------------------------------
    // Step 7: Return success response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      message: 'Classroom updated successfully.',
      classroom: {
        ...updatedClassroom,
        teacherName: teacher.fullName,
      },
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error updating classroom:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while updating the classroom.' },
      { status: 500 }
    );
  }
}
