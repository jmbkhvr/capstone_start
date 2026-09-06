import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';
import { computePassageWordCount, ALLOWED_GRADE_LEVELS } from '../route';

// ============================================================================
// SINGLE READING MATERIAL DETAILS & UPDATE API ENDPOINT (MODULE 6)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves the full details of a specific reading passage by its ID,
//    verifying that the material belongs to the requesting teacher.
// 2. PUT: Updates the reading passage's title, description, difficulty level,
//    grade level, and content, while recalculating the word count.
//
// The stored passage content serves as the "reference passage" for future
// reading assessments where it will be compared against a reader's live
// transcript to determine correct words, reading percentage, and WPM.
//
// Security Note:
// Multi-tenant isolation is strictly verified. Cross-teacher access attempts
// are blocked with HTTP 404 (or 403), preventing data leakage.
// ============================================================================

// ----------------------------------------------------------------------------
// GET: Fetch details of a single reading material
// ----------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Verify teacher session authentication
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view this reading material.' },
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
    // Step 2: Query database for the reading material
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

    // ------------------------------------------------------------------------
    // Step 3: Enforce teacher ownership check (multi-tenant isolation)
    // ------------------------------------------------------------------------
    if (material.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view this reading material.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error('Error retrieving reading material:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving reading material.' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// PUT: Update an existing reading passage
// ----------------------------------------------------------------------------
export async function PUT(
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
        { error: 'Unauthorized. Please log in to edit reading materials.' },
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
    // Step 2: Check if material exists and belongs to the authenticated teacher
    // ------------------------------------------------------------------------
    const existing = db
      .prepare('SELECT * FROM reading_materials WHERE id = ?')
      .get(id) as any;

    if (!existing) {
      return NextResponse.json(
        { error: 'Reading material not found.' },
        { status: 404 }
      );
    }

    if (existing.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: 'Access denied. You cannot edit a reading material that belongs to another teacher.' },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Parse and sanitize incoming update payload
    // ------------------------------------------------------------------------
    const body = await request.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const rawContent = (body.content || '').trim();
    const difficulty = (body.difficulty || existing.difficulty).trim();
    const gradeLevel = (body.gradeLevel || existing.gradeLevel).trim();

    // ------------------------------------------------------------------------
    // Step 4: Validate inputs
    // ------------------------------------------------------------------------
    if (!title) {
      return NextResponse.json(
        { error: 'Material title cannot be empty.' },
        { status: 400 }
      );
    }

    if (title.length < 2 || title.length > 120) {
      return NextResponse.json(
        { error: 'Material title must be between 2 and 120 characters.' },
        { status: 400 }
      );
    }

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Reading content cannot be empty.' },
        { status: 400 }
      );
    }

    // Validate difficulty and grade level against allowed values
    const validDifficulties = ['Easy', 'Moderate', 'Difficult'];
    const validatedDifficulty = validDifficulties.includes(difficulty) ? difficulty : existing.difficulty;
    const validatedGradeLevel = ALLOWED_GRADE_LEVELS.includes(gradeLevel) ? gradeLevel : existing.gradeLevel;

    // ------------------------------------------------------------------------
    // Step 5: Recalculate word count for the updated passage content
    // ------------------------------------------------------------------------
    // Always use passage word counting (Word Lists no longer supported).
    const wordCount = computePassageWordCount(rawContent);

    if (wordCount === 0) {
      return NextResponse.json(
        { error: 'Reading passage must contain at least one readable word.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 6: Persist updates into SQLite
    // ------------------------------------------------------------------------
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE reading_materials
      SET
        title = ?,
        description = ?,
        content = ?,
        wordCount = ?,
        difficulty = ?,
        gradeLevel = ?,
        updatedAt = ?
      WHERE id = ? AND teacherId = ?
    `).run(
      title,
      description || null,
      rawContent,
      wordCount,
      validatedDifficulty,
      validatedGradeLevel,
      nowIso,
      id,
      teacher.id
    );

    // Retrieve updated record
    const updatedMaterial = db
      .prepare('SELECT * FROM reading_materials WHERE id = ?')
      .get(id);

    return NextResponse.json({
      success: true,
      message: 'Reading material updated successfully.',
      material: updatedMaterial,
    });
  } catch (error) {
    console.error('Error updating reading material:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating reading material.' },
      { status: 500 }
    );
  }
}
