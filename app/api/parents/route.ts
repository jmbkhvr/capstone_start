import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// PARENT REGISTRATION MANAGEMENT LIST API ENDPOINT
// ============================================================================
// What this endpoint does:
// 1. Authenticates the requesting teacher via the secure HTTP-Only JWT session cookie.
// 2. Enforces backend authorization and data scoping.
// 3. Fetches parent accounts and registration requests matching optional search
//    queries (parent name, email, child name) and status filters ('All', 'Pending',
//    'Approved', 'Rejected').
// 4. Calculates aggregate counts per status category for frontend filter tab badges.
// 5. Strips sensitive security fields (passwordHash) to ensure privacy.
//
// Security Note:
// Only authenticated teachers can query parent lists. Raw password hashes are
// NEVER included in the returned payload.
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Authenticate the requesting teacher from session cookies
    // ------------------------------------------------------------------------
    // Reads the encrypted session token from the HTTP-Only cookie and verifies it.
    // If no valid session exists, returns HTTP 401 Unauthorized immediately.
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to manage parent records.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Parse search and status filter query parameters from the request
    // ------------------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get('status') || 'All').trim();
    const searchQuery = (searchParams.get('search') || '').trim();

    // ------------------------------------------------------------------------
    // Step 3: Verify the parents table exists in the database
    // ------------------------------------------------------------------------
    // Check SQLite master catalog to prevent query errors if table is not yet initialized.
    const hasTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='parents'")
      .get();

    if (!hasTable) {
      return NextResponse.json({
        parents: [],
        counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      });
    }

    // ------------------------------------------------------------------------
    // Step 4: Compute aggregate status counts for the authenticated teacher
    // ------------------------------------------------------------------------
    // Scoped to parents assigned to this teacher or unassigned Grade 3 applicants.
    const countRows = db
      .prepare(
        `SELECT status, COUNT(*) as count 
         FROM parents 
         WHERE (teacherId = ? OR teacherId IS NULL)
         GROUP BY status`
      )
      .all(teacher.id) as Array<{ status: string; count: number }>;

    const counts = {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    countRows.forEach((row) => {
      const lower = row.status.toLowerCase();
      if (lower === 'pending') counts.pending = row.count;
      else if (lower === 'approved') counts.approved = row.count;
      else if (lower === 'rejected') counts.rejected = row.count;
      counts.all += row.count;
    });

    // ------------------------------------------------------------------------
    // Step 5: Construct parameterized SQL query for filtered parent records
    // ------------------------------------------------------------------------
    let query = `
      SELECT 
        id, 
        fullName, 
        email, 
        contactNumber, 
        childName, 
        childGradeLevel, 
        childSection, 
        teacherId, 
        status, 
        rejectionReason, 
        createdAt, 
        updatedAt
      FROM parents
      WHERE (teacherId = ? OR teacherId IS NULL)
    `;
    const params: any[] = [teacher.id];

    // Apply status filter if not 'All'
    if (statusFilter !== 'All' && ['Pending', 'Approved', 'Rejected'].includes(statusFilter)) {
      query += ` AND status = ?`;
      params.push(statusFilter);
    }

    // Apply search filter across parent name, email, and child name
    if (searchQuery.length > 0) {
      query += ` AND (fullName LIKE ? OR email LIKE ? OR childName LIKE ?)`;
      const pattern = `%${searchQuery}%`;
      params.push(pattern, pattern, pattern);
    }

    // Order results: Pending registrations first, then newest first
    query += ` ORDER BY CASE WHEN status = 'Pending' THEN 0 ELSE 1 END, createdAt DESC`;

    const parents = db.prepare(query).all(...params);

    // ------------------------------------------------------------------------
    // Step 6: Return sanitized parent list and status counts
    // ------------------------------------------------------------------------
    return NextResponse.json({
      parents,
      counts,
    });
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error Handling: Log unexpected errors and return safe HTTP 500 error
    // ------------------------------------------------------------------------
    console.error('Error fetching parent accounts:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while retrieving parent records.' },
      { status: 500 }
    );
  }
}
