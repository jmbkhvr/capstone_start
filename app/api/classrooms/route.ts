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
    // Step 3: Verify the classrooms table exists in the database
    // ------------------------------------------------------------------------
    // Check the SQLite master catalog to prevent crashes if table is missing.
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='classrooms'")
      .get();

    if (!tableExists) {
      return NextResponse.json({
        classrooms: [],
        counts: { all: 0, active: 0, archived: 0 },
      });
    }

    // ------------------------------------------------------------------------
    // Step 4: Compute aggregate status counts for this authenticated teacher
    // ------------------------------------------------------------------------
    // This provides the numbers displayed on the "All", "Active", and "Archived" tabs.
    const countRows = db
      .prepare(
        `SELECT status, COUNT(*) as count 
         FROM classrooms 
         WHERE teacherId = ? 
         GROUP BY status`
      )
      .all(teacher.id) as Array<{ status: string; count: number }>;

    const counts = {
      all: 0,
      active: 0,
      archived: 0,
    };

    countRows.forEach((row) => {
      const lower = row.status.toLowerCase();
      if (lower === 'active') {
        counts.active = row.count;
      } else if (lower === 'archived') {
        counts.archived = row.count;
      }
      counts.all += row.count;
    });

    // ------------------------------------------------------------------------
    // Step 5: Check if students table exists to calculate student counts per class
    // ------------------------------------------------------------------------
    // Future Module 5 will add students. If students table exists, we count them.
    // Otherwise, default studentCount to 0 safely without errors.
    const hasStudentsTable = Boolean(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='students'")
        .get()
    );

    // ------------------------------------------------------------------------
    // Step 6: Construct parameterized SQL query for classrooms
    // ------------------------------------------------------------------------
    let query = `
      SELECT 
        id, 
        name, 
        gradeLevel, 
        section, 
        schoolYear, 
        description, 
        teacherId, 
        status, 
        createdAt, 
        updatedAt
      FROM classrooms
      WHERE teacherId = ?
    `;

    const queryParams: any[] = [teacher.id];

    // Apply status filter if not 'All'
    if (statusFilter !== 'All') {
      query += ` AND status = ?`;
      queryParams.push(statusFilter);
    }

    // Apply search filter if query text is provided
    if (searchQuery.length > 0) {
      query += ` AND (
        name LIKE ? OR 
        gradeLevel LIKE ? OR 
        schoolYear LIKE ? OR 
        section LIKE ? OR
        description LIKE ?
      )`;
      const wild = `%${searchQuery}%`;
      queryParams.push(wild, wild, wild, wild, wild);
    }

    // Order by creation date descending (newest first)
    query += ` ORDER BY createdAt DESC`;

    const classrooms = db.prepare(query).all(...queryParams) as Array<any>;

    // ------------------------------------------------------------------------
    // Step 7: Attach student counts to each classroom
    // ------------------------------------------------------------------------
    const classroomsWithStudentCounts = classrooms.map((classroom) => {
      let studentCount = 0;
      if (hasStudentsTable) {
        const studentResult = db
          .prepare(
            `SELECT COUNT(*) as count FROM students WHERE classroomId = ? AND teacherId = ?`
          )
          .get(classroom.id, teacher.id) as { count: number } | undefined;
        studentCount = studentResult?.count || 0;
      }

      return {
        ...classroom,
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
    const existingClassroom = db
      .prepare(
        `SELECT id FROM classrooms 
         WHERE teacherId = ? AND LOWER(name) = LOWER(?) AND schoolYear = ? AND status = 'Active'`
      )
      .get(teacher.id, cleanName, cleanSchoolYear);

    if (existingClassroom) {
      return NextResponse.json(
        {
          error: `An active classroom named "${cleanName}" already exists for school year ${cleanSchoolYear}.`,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Insert the new classroom into the database
    // ------------------------------------------------------------------------
    const classroomId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO classrooms (
        id, 
        name, 
        gradeLevel, 
        section, 
        schoolYear, 
        description, 
        teacherId, 
        status, 
        createdAt, 
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`
    ).run(
      classroomId,
      cleanName,
      cleanGradeLevel,
      cleanSection || null,
      cleanSchoolYear,
      cleanDescription || null,
      teacher.id,
      now,
      now
    );

    // ------------------------------------------------------------------------
    // Step 6: Fetch the newly created classroom record
    // ------------------------------------------------------------------------
    const newClassroom = db
      .prepare('SELECT * FROM classrooms WHERE id = ?')
      .get(classroomId) as any;

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
