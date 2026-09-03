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
    const teacherRecord = db
      .prepare('SELECT id, teacherId, fullName, email FROM teachers WHERE id = ?')
      .get(sessionTeacher.id) as {
      id: string;
      teacherId: string;
      fullName: string;
      email: string;
    } | undefined;

    if (!teacherRecord) {
      return NextResponse.json(
        { error: 'Teacher profile not found. Session may be invalid.' },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Check database schema for future module tables
    // ------------------------------------------------------------------------
    // Helper function that checks whether a specific table currently exists
    // in the SQLite master schema table, preventing runtime query crashes.
    const tableExists = (tableName: string): boolean => {
      const result = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(tableName);
      return Boolean(result);
    };

    // ------------------------------------------------------------------------
    // Step 4: Compute summary counts scoped strictly to this teacher
    // ------------------------------------------------------------------------
    let totalStudents = 0;
    let totalClasses = 0;
    let totalAssessments = 0;
    let studentsNeedingAttention = 0;

    // Check if classrooms table exists from future Module 3
    if (tableExists('classrooms')) {
      const classCountResult = db
        .prepare('SELECT COUNT(*) as count FROM classrooms WHERE teacherId = ?')
        .get(teacherRecord.id) as { count: number };
      totalClasses = classCountResult?.count || 0;
    }

    // Check if students table exists from future Module 4
    if (tableExists('students')) {
      const studentCountResult = db
        .prepare('SELECT COUNT(*) as count FROM students WHERE teacherId = ?')
        .get(teacherRecord.id) as { count: number };
      totalStudents = studentCountResult?.count || 0;

      // Calculate students flagged for intervention (e.g. Phil-IRI frustration level)
      if (tableExists('student_assessments')) {
        const attentionResult = db
          .prepare(
            `SELECT COUNT(DISTINCT studentId) as count 
             FROM student_assessments 
             WHERE teacherId = ? AND status = 'Needs Attention'`
          )
          .get(teacherRecord.id) as { count: number };
        studentsNeedingAttention = attentionResult?.count || 0;
      }
    }

    // Check if assessments table exists from future Module 5
    if (tableExists('assessments')) {
      const assessmentCountResult = db
        .prepare('SELECT COUNT(*) as count FROM assessments WHERE teacherId = ?')
        .get(teacherRecord.id) as { count: number };
      totalAssessments = assessmentCountResult?.count || 0;
    }

    // ------------------------------------------------------------------------
    // Step 5: Query recent assessment records for this teacher
    // ------------------------------------------------------------------------
    // In accordance with Section 7: If the assessment functionality has not yet
    // been populated by pupils, provide an empty array so the frontend displays
    // the clean empty state without using fabricated or fake data.
    interface RecentAssessmentRow {
      id: string;
      studentName: string;
      assessmentName: string;
      date: string;
      score: number | null;
      status: 'Completed' | 'In Progress' | 'Pending' | 'Needs Review';
    }

    let recentAssessments: RecentAssessmentRow[] = [];

    if (tableExists('student_assessments')) {
      const rows = db
        .prepare(
          `SELECT id, studentName, assessmentName, date, score, status 
           FROM student_assessments 
           WHERE teacherId = ? 
           ORDER BY date DESC 
           LIMIT 5`
        )
        .all(teacherRecord.id) as RecentAssessmentRow[];
      recentAssessments = rows || [];
    }

    // ------------------------------------------------------------------------
    // Step 6: Query student performance overview metrics
    // ------------------------------------------------------------------------
    // In accordance with Section 8: Prepares performance categories (Reading
    // Accuracy, Pronunciation, Fluency, and Overall Performance).
    // If real data has not been logged yet, category scores remain at 0 or empty
    // so the frontend can display an honest empty state.
    interface PerformanceMetric {
      category: string;
      score: number;
      benchmark: number;
    }

    let performanceOverview: PerformanceMetric[] = [];

    if (tableExists('performance_metrics')) {
      const metrics = db
        .prepare(
          `SELECT category, AVG(score) as score, benchmark 
           FROM performance_metrics 
           WHERE teacherId = ? 
           GROUP BY category`
        )
        .all(teacherRecord.id) as PerformanceMetric[];
      performanceOverview = metrics || [];
    }

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
