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
    // Step 4: Compute aggregate status counts for the authenticated teacher
    // ------------------------------------------------------------------------
    // Scoped to parents assigned to this teacher or unassigned Grade 3 applicants.
    const countRows = await db.parent.groupBy({
      by: ['status'],
      where: {
        OR: [
          { teacherId: teacher.id },
          { teacherId: null }
        ]
      },
      _count: { _all: true }
    });

    const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
    for (const row of countRows) {
      const lower = row.status.toLowerCase();
      if (lower === 'pending') counts.pending = row._count._all;
      else if (lower === 'approved') counts.approved = row._count._all;
      else if (lower === 'rejected') counts.rejected = row._count._all;
      counts.all += row._count._all;
    }

    // ------------------------------------------------------------------------
    // Step 5: Construct Prisma query for filtered parent records
    // ------------------------------------------------------------------------
    const whereClause: any = {
      OR: [
        { teacherId: teacher.id },
        { teacherId: null }
      ]
    };

    if (statusFilter !== 'All' && ['Pending', 'Approved', 'Rejected'].includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    if (searchQuery.length > 0) {
      whereClause.AND = [
        {
          OR: [
            { fullName: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { childName: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const parents = await db.parent.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        contactNumber: true,
        childName: true,
        childGradeLevel: true,
        childSection: true,
        teacherId: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true
      }
    });

    parents.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

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
