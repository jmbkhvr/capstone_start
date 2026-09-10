import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';
import { SUPPORTED_GRADE_LEVELS } from '@/lib/constants';

// ============================================================================
// CLASSROOM MANAGEMENT LIST & CREATE API ENDPOINT (MODULE 4)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves the classrooms belonging exclusively to the authenticated teacher.
//    Supports real-time search filtering (by classroom name, grade level, section,
//    or school year) and lifecycle status filtering ('All', 'Active', 'Archived').
//    Calculates live tab badge counts so teachers see their current totals.
// 2. POST: Validates input fields and creates a new classroom associated with the
//    authenticated teacher. Prevents duplicate active classroom names for the same teacher.
//
// Security Note:
// Teacher authorization is strictly enforced on the backend. All database queries
// are scoped to the authenticated teacher's unique ID (`teacherId`).
// ============================================================================

// ----------------------------------------------------------------------------
// GET: Retrieve classrooms list with search, status filtering, and count badges
// ----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from the session cookie
    // ------------------------------------------------------------------------
    // Reads the encrypted session token from the HTTP-Only cookie and verifies it.
    // If no valid session exists, returns HTTP 401 Unauthorized immediately.
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to view classrooms.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Parse query parameters from the request URL
    // ------------------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get('status') || 'All').trim();
    const searchQuery = (searchParams.get('search') || '').trim();

    // ------------------------------------------------------------------------


    // ------------------------------------------------------------------------
    // Step 4: Compute aggregate status counts for this authenticated teacher
    // ------------------------------------------------------------------------
    // This provides the numbers displayed on the "All", "Active", and "Archived" tabs.
    const countRows = await db.classroom.groupBy({
      by: ['status'],
      where: { teacherId: teacher.id },
      _count: { _all: true }
    });

    const counts = { all: 0, active: 0, archived: 0 };
    for (const row of countRows) {
      const lower = row.status.toLowerCase();
      if (lower === 'active') counts.active = row._count._all;
      else if (lower === 'archived') counts.archived = row._count._all;
      counts.all += row._count._all;
    }

    // ------------------------------------------------------------------------
    // Step 6: Construct Prisma query for classrooms
    // ------------------------------------------------------------------------
    const whereClause: any = { teacherId: teacher.id };
    
    if (statusFilter !== 'All') {
      whereClause.status = statusFilter;
    }

    if (searchQuery.length > 0) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { gradeLevel: { contains: searchQuery, mode: 'insensitive' } },
            { schoolYear: { contains: searchQuery, mode: 'insensitive' } },
            { section: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        }
      ];
    }

    const classrooms = await db.classroom.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ------------------------------------------------------------------------
    // Step 7: Attach student counts to each classroom
    // ------------------------------------------------------------------------
    const classroomsWithStudentCounts = classrooms.map((classroom) => {
      const studentCount = classroom._count.students;
      const { _count, ...rest } = classroom;
      return {
        ...rest,
        studentCount,
        teacherName: teacher.fullName,
      };
    });

    // ------------------------------------------------------------------------
    // Step 8: Return formatted response
    // ------------------------------------------------------------------------
    return NextResponse.json({
      classrooms: classroomsWithStudentCounts,
      counts,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe error message
    // ------------------------------------------------------------------------
    console.error('Error fetching classrooms:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while retrieving classrooms.' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// POST: Create a new classroom belonging to the authenticated teacher
// ----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from session cookies
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to create a classroom.' },
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

    const { name, gradeLevel, section = '', schoolYear, description = '' } = body;

    // ------------------------------------------------------------------------
    // Step 3: Validate required fields
    // ------------------------------------------------------------------------
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

    // Validate Grade Level: Ensure it matches an allowed elementary grade (Grade 1-6)
    // Grade 3 is valid, but the system is generic and accepts any supported elementary level.
    const cleanGradeLevel = (gradeLevel || '').trim();
    if (!cleanGradeLevel || !SUPPORTED_GRADE_LEVELS.includes(cleanGradeLevel as any)) {
      return NextResponse.json(
        {
          error: `Grade Level is required and must be one of: ${SUPPORTED_GRADE_LEVELS.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // Validate School Year (e.g., '2026-2027')
    if (!schoolYear || typeof schoolYear !== 'string' || schoolYear.trim().length < 4) {
      return NextResponse.json(
        { error: 'School Year is required (e.g., 2026-2027).' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanSection = (section || '').trim();
    const cleanSchoolYear = schoolYear.trim();
    const cleanDescription = (description || '').trim();

    // ------------------------------------------------------------------------
    // Step 4: Check for duplicate active classroom name for this teacher
    // ------------------------------------------------------------------------
    // Prevents teachers from accidentally creating two active classrooms with
    // the exact same name for the same school year.
    const existingClassroom = await db.classroom.findFirst({
      where: {
        teacherId: teacher.id,
        name: { equals: cleanName, mode: 'insensitive' },
        schoolYear: cleanSchoolYear,
        status: 'Active'
      },
      select: { id: true }
    });

    if (existingClassroom) {
      return NextResponse.json(
        {
          error: `An active classroom named "${cleanName}" already exists for school year ${cleanSchoolYear}.`,
        },
        { status: 409 }
      );
    }

    const newClassroom = await db.classroom.create({
      data: {
        name: cleanName,
        gradeLevel: cleanGradeLevel,
        section: cleanSection || null,
        schoolYear: cleanSchoolYear,
        description: cleanDescription || null,
        teacherId: teacher.id,
        status: 'Active'
      }
    });

    // ------------------------------------------------------------------------
    // Step 7: Return success response with HTTP 201 Created
    // ------------------------------------------------------------------------
    return NextResponse.json(
      {
        message: 'Classroom created successfully.',
        classroom: {
          ...newClassroom,
          studentCount: 0,
          teacherName: teacher.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe error message
    // ------------------------------------------------------------------------
    console.error('Error creating classroom:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while creating the classroom.' },
      { status: 500 }
    );
  }
}
