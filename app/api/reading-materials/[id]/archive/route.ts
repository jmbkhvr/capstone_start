import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// ARCHIVE & RESTORE READING MATERIAL API ENDPOINT (MODULE 6)
// ============================================================================
// What this endpoint does:
// Toggles the lifecycle status of a reading material between 'Active' and 'Archived'.
//
// Archiving Note (Prompt Section 13):
// Reading materials are soft-archived rather than permanently deleted so that
// historical assessments, student speech evaluation recordings, and Phil-IRI
// performance reports in future modules (Modules 7+) maintain relational integrity.
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Verify teacher session authentication
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to archive or restore reading materials.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Reading material ID is required.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Verify material exists and belongs to this teacher
    // ------------------------------------------------------------------------
    const material = db
      .prepare('SELECT * FROM reading_materials WHERE id = ?')
      .get(id) as any;

    if (!material) {
      return NextResponse.json(
        { error: 'Reading material not found.' },
        { status: 404 }
      );
    }

    if (material.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: 'Access denied. You cannot archive or restore a reading material you do not own.' },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Determine new status (optional explicit status in body, or toggle)
    // ------------------------------------------------------------------------
    let newStatus: string;
    try {
      const body = await request.json();
      if (body.action === 'archive') {
        newStatus = 'Archived';
      } else if (body.action === 'restore') {
        newStatus = 'Active';
      } else {
        newStatus = material.status === 'Active' ? 'Archived' : 'Active';
      }
    } catch {
      // If no JSON body provided, toggle automatically
      newStatus = material.status === 'Active' ? 'Archived' : 'Active';
    }

    // ------------------------------------------------------------------------
    // Step 4: Update SQLite record
    // ------------------------------------------------------------------------
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE reading_materials
      SET status = ?, updatedAt = ?
      WHERE id = ? AND teacherId = ?
    `).run(newStatus, nowIso, id, teacher.id);

    const actionWord = newStatus === 'Archived' ? 'archived' : 'restored';

    return NextResponse.json({
      success: true,
      message: `Reading material successfully ${actionWord}.`,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error toggling reading material archive status:', error);
    return NextResponse.json(
      { error: 'Internal server error while archiving reading material.' },
      { status: 500 }
    );
  }
}
