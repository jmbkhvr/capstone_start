import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// STUDENT MANAGEMENT LIST & CREATE API ENDPOINT (MODULE 5)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves the Grade 3 student profiles belonging exclusively to the
//    authenticated teacher. Supports classroom filtering, status filtering
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
    // Step 3: Verify the students table exists in the database
    // ------------------------------------------------------------------------
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='students'")
      .get();

    if (!tableExists) {
      return NextResponse.json({
        success: true,
        students: [],
        counts: { all: 0, active: 0, inactive: 0 },
        classrooms: [],
        parents: [],
      });
    }

    // ------------------------------------------------------------------------
    // Step 4: Fetch teacher's active classrooms (for filter and add dropdowns)
    // ------------------------------------------------------------------------
    const teacherClassrooms = db
      .prepare(
        `SELECT id, name, section, gradeLevel, schoolYear 
         FROM classrooms 
         WHERE teacherId = ? AND status = 'Active' 
         ORDER BY name ASC`
      )
      .all(teacher.id) as Array<any>;

    // ------------------------------------------------------------------------
    // Step 5: Fetch approved parents accessible to this teacher
    // ------------------------------------------------------------------------
    const hasParentsTable = Boolean(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='parents'")
        .get()
    );

    let teacherParents: any[] = [];
    if (hasParentsTable) {
      teacherParents = db
        .prepare(
          `SELECT id, fullName, email, childName, childSection 
           FROM parents 
           WHERE (teacherId = ? OR teacherId IS NULL) AND status = 'Approved' 
           ORDER BY fullName ASC`
        )
        .all(teacher.id) as Array<any>;
    }

    // ------------------------------------------------------------------------
    // Step 6: Compute aggregate status counts for this authenticated teacher
    // ------------------------------------------------------------------------
    // Status counts are calculated scoped by classroom if a classroom filter is active
    let countQuery = `
      SELECT status, COUNT(*) as count 
      FROM students 
      WHERE teacherId = ?
    `;
    const countParams: any[] = [teacher.id];

    if (classroomFilter !== 'All') {
      countQuery += ` AND classroomId = ?`;
      countParams.push(classroomFilter);
    }
    countQuery += ` GROUP BY status`;

    const countRows = db.prepare(countQuery).all(...countParams) as Array<{
      status: string;
      count: number;
    }>;

    const counts = {
      all: 0,
      active: 0,
      inactive: 0,
    };

    countRows.forEach((row) => {
      const lower = row.status.toLowerCase();
      if (lower === 'active') {
        counts.active = row.count;
      } else if (lower === 'inactive') {
        counts.inactive = row.count;
      }
      counts.all += row.count;
    });

    // ------------------------------------------------------------------------
    // Step 7: Construct parameterized SQL query for students with joins
    // ------------------------------------------------------------------------
    let query = `
      SELECT 
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
      WHERE s.teacherId = ?
    `;

    const queryParams: any[] = [teacher.id];

    // Filter by specific classroom
    if (classroomFilter !== 'All') {
      query += ` AND s.classroomId = ?`;
      queryParams.push(classroomFilter);
    }

    // Filter by lifecycle status ('Active' | 'Inactive')
    if (statusFilter !== 'All') {
      query += ` AND s.status = ?`;
      queryParams.push(statusFilter);
    }

    // Apply keyword search filter (matches student name or parent name)
    if (searchQuery.length > 0) {
      query += ` AND (
        s.fullName LIKE ? OR 
        s.firstName LIKE ? OR 
        s.lastName LIKE ? OR 
        p.fullName LIKE ?
      )`;
      const wild = `%${searchQuery}%`;
      queryParams.push(wild, wild, wild, wild);
    }

    // Order by student full name alphabetically
    query += ` ORDER BY s.lastName ASC, s.firstName ASC`;

    const students = db.prepare(query).all(...queryParams) as Array<any>;

    // ------------------------------------------------------------------------
    // Step 8: Return formatted response payload
    // ------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      students,
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
      gradeLevel = 'Grade 3',
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

    const cleanFirst = firstName.trim();
    const cleanMiddle = (middleName || '').trim();
    const cleanLast = lastName.trim();
    const cleanGrade = (gradeLevel || 'Grade 3').trim();
    const cleanFullName = cleanMiddle
      ? `${cleanFirst} ${cleanMiddle} ${cleanLast}`
      : `${cleanFirst} ${cleanLast}`;

    // ------------------------------------------------------------------------
    // Step 4: Verify the selected classroom belongs to the authenticated teacher
    // ------------------------------------------------------------------------
    const classroom = db
      .prepare('SELECT id, name, status FROM classrooms WHERE id = ? AND teacherId = ?')
      .get(classroomId, teacher.id) as { id: string; name: string; status: string } | undefined;

    if (!classroom) {
      return NextResponse.json(
        { error: 'The selected classroom does not exist or does not belong to your account.' },
        { status: 403 }
      );
    }

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

    // ------------------------------------------------------------------------
    // Step 6: Prevent duplicate active student in the same classroom
    // ------------------------------------------------------------------------
    const duplicateStudent = db
      .prepare(
        `SELECT id FROM students 
         WHERE teacherId = ? AND classroomId = ? AND LOWER(firstName) = LOWER(?) AND LOWER(lastName) = LOWER(?) AND status = 'Active'`
      )
      .get(teacher.id, classroomId, cleanFirst, cleanLast);

    if (duplicateStudent) {
      return NextResponse.json(
        {
          error: `An active student named "${cleanFirst} ${cleanLast}" already exists in "${classroom.name}".`,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 7: Insert the student record into SQLite
    // ------------------------------------------------------------------------
    const studentId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO students (
        id,
        firstName,
        middleName,
        lastName,
        fullName,
        gradeLevel,
        classroomId,
        teacherId,
        parentId,
        status,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`
    ).run(
      studentId,
      cleanFirst,
      cleanMiddle || null,
      cleanLast,
      cleanFullName,
      cleanGrade,
      classroomId,
      teacher.id,
      validParentId,
      now,
      now
    );

    // ------------------------------------------------------------------------
    // Step 8: Fetch created student record with joined classroom and parent info
    // ------------------------------------------------------------------------
    const newStudent = db
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
      .get(studentId) as any;

    // ------------------------------------------------------------------------
    // Step 9: Return success response with HTTP 201 Created
    // ------------------------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: 'Student profile created successfully.',
        student: newStudent,
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
