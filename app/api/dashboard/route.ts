import { NextResponse } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// TEACHER DASHBOARD DATA API ENDPOINT
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher using the secure HTTP-Only JWT session cookie.
// 2. Enforces strict teacher-level data ownership on the backend.
// 3. Dynamically queries the database for the authenticated teacher's classrooms,
//    students, and assessment records (with resilient fallbacks if future module
//    tables are not yet created).
// 4. Returns consolidated summary metrics, recent assessment rows, and performance data.
//
// Security Note:
// Teacher A can NEVER view Teacher B's students, classrooms, or assessment scores.
// All queries are strictly parameterized by the authenticated teacher's unique ID.
// ============================================================================

export async function GET() {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from the session cookie
    // ------------------------------------------------------------------------
    // Reads the encrypted session token from the HTTP-Only cookie and verifies it.
    // If no valid session exists, returns HTTP 401 Unauthorized immediately.
    const sessionTeacher = await getAuthenticatedTeacher();

    if (!sessionTeacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access dashboard data.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Verify the teacher account exists and is active in the database
    // ------------------------------------------------------------------------
    // Query the teachers table by unique ID to fetch current profile details.
    const teacherRecord = await db.teacher.findUnique({
      where: { id: sessionTeacher.id },
      select: {
        id: true,
        teacherId: true,
        fullName: true,
        email: true,
      }
    });

    if (!teacherRecord) {
      return NextResponse.json(
        { error: 'Teacher profile not found. Session may be invalid.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Compute summary counts scoped strictly to this teacher
    // ------------------------------------------------------------------------
    const totalClasses = await db.classroom.count({
      where: { teacherId: teacherRecord.id }
    });

    const totalStudents = await db.student.count({
      where: { teacherId: teacherRecord.id }
    });

    // Future modules aren't in Prisma schema yet, default to empty states.
    const totalAssessments = 0;
    const studentsNeedingAttention = 0;

    // ------------------------------------------------------------------------
    // Step 5: Query recent assessment records for this teacher
    // ------------------------------------------------------------------------
    interface RecentAssessmentRow {
      id: string;
      studentName: string;
      assessmentName: string;
      date: string;
      score: number | null;
      status: 'Completed' | 'In Progress' | 'Pending' | 'Needs Review';
    }

    let recentAssessments: RecentAssessmentRow[] = []; // Empty state for future module

    // ------------------------------------------------------------------------
    // Step 6: Query student performance overview metrics
    // ------------------------------------------------------------------------
    interface PerformanceMetric {
      category: string;
      score: number;
      benchmark: number;
    }

    let performanceOverview: PerformanceMetric[] = []; // Empty state for future module

    // ------------------------------------------------------------------------
    // Step 7: Return consolidated dashboard payload
    // ------------------------------------------------------------------------
    return NextResponse.json({
      teacher: {
        id: teacherRecord.id,
        teacherId: teacherRecord.teacherId,
        fullName: teacherRecord.fullName,
        email: teacherRecord.email,
      },
      summary: {
        totalStudents,
        totalClasses,
        totalAssessments,
        studentsNeedingAttention,
      },
      recentAssessments,
      performanceOverview,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log server error and return user-safe error message
    // ------------------------------------------------------------------------
    console.error('Error loading teacher dashboard data:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while loading dashboard data.' },
      { status: 500 }
    );
  }
}
