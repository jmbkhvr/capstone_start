import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedTeacher } from '@/lib/auth';
import db from '@/lib/db';

// ============================================================================
// READING MATERIALS LIST & CREATE API ENDPOINT (MODULE 6)
// ============================================================================
// What this endpoint does:
// 1. GET: Retrieves reading passages created by the authenticated teacher.
//    Supports searching (by title, description, content), filtering by
//    grade level, difficulty, and status, along with sorting options.
//    Also returns summary counts for status tabs and KPI cards.
// 2. POST: Validates teacher-submitted reading passage, calculates word count
//    accurately (excluding punctuation), and persists the record into SQLite.
//    The stored passage serves as the reference text for future reading
//    assessments (word-matching comparison with live transcript).
//
// Security Note:
// Multi-tenant authorization is strictly enforced. Teachers can only access and
// manage reading materials that belong to their unique teacher ID.
// ============================================================================

// ----------------------------------------------------------------------------
// Allowed grade levels for reading materials (Grade 1 through Grade 6).
// ----------------------------------------------------------------------------
export const ALLOWED_GRADE_LEVELS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
];

// ----------------------------------------------------------------------------
// Helper Function: Compute accurate word count for continuous reading passages
// ----------------------------------------------------------------------------
// Splits continuous text by whitespace and removes leading/trailing punctuation
// from each token so punctuation (e.g. periods, commas, quotes) is not counted
// as separate words. This count represents the total reference words that a
// reader is expected to read aloud during an assessment.
export function computePassageWordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;

  // Split by any sequence of whitespace characters.
  const tokens = text.trim().split(/\s+/);

  // Filter for tokens containing at least one alphanumeric character.
  const validWords = tokens.filter((token) => {
    // Strip punctuation from ends of token.
    const cleaned = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    return cleaned.length > 0;
  });

  return validWords.length;
}

// ----------------------------------------------------------------------------
// GET: Retrieve reading materials with search, filter, and sort capabilities
// ----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Verify teacher session authentication
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to view reading materials.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Extract query parameters from URL
    // ------------------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get('search') || '').trim();
    const gradeFilter = (searchParams.get('grade') || 'All').trim();
    const difficultyFilter = (searchParams.get('difficulty') || 'All').trim();
    const statusFilter = (searchParams.get('status') || 'All').trim();
    const sortBy = (searchParams.get('sort') || 'createdAt').trim();
    const sortOrder = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // ------------------------------------------------------------------------
    // Step 3: Verify the reading_materials table exists
    // ------------------------------------------------------------------------
    const tableCheck = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reading_materials'")
      .get();

    if (!tableCheck) {
      return NextResponse.json({
        success: true,
        materials: [],
        counts: { all: 0, active: 0, archived: 0 },
      });
    }

    // ------------------------------------------------------------------------
    // Step 4: Build dynamic SQL query conditions scoped to the authenticated teacher
    // ------------------------------------------------------------------------
    const conditions: string[] = ['teacherId = ?'];
    const queryParams: any[] = [teacher.id];

    // Status filter: 'All', 'Active', or 'Archived'
    if (statusFilter !== 'All') {
      conditions.push('status = ?');
      queryParams.push(statusFilter);
    }

    // Grade level filter: e.g. 'Grade 1', 'Grade 3', etc.
    if (gradeFilter !== 'All') {
      conditions.push('gradeLevel = ?');
      queryParams.push(gradeFilter);
    }

    // Difficulty filter: 'Easy', 'Moderate', or 'Difficult'
    if (difficultyFilter !== 'All') {
      conditions.push('difficulty = ?');
      queryParams.push(difficultyFilter);
    }

    // Keyword search: matches against title, description, or content
    if (searchQuery.length > 0) {
      conditions.push('(title LIKE ? OR description LIKE ? OR content LIKE ?)');
      const wildQuery = `%${searchQuery}%`;
      queryParams.push(wildQuery, wildQuery, wildQuery);
    }

    // Determine safe sorting column to prevent SQL injection
    const allowedSortColumns: Record<string, string> = {
      title: 'title',
      wordCount: 'wordCount',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      difficulty: 'difficulty',
      gradeLevel: 'gradeLevel',
    };
    const sortColumn = allowedSortColumns[sortBy] || 'createdAt';

    // ------------------------------------------------------------------------
    // Step 5: Execute query to fetch filtered reading materials
    // ------------------------------------------------------------------------
    const whereClause = conditions.join(' AND ');
    const materialsSql = `
      SELECT
        id,
        teacherId,
        title,
        description,
        type,
        content,
        wordCount,
        difficulty,
        gradeLevel,
        status,
        createdAt,
        updatedAt
      FROM reading_materials
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
    `;

    const materials = db.prepare(materialsSql).all(...queryParams);

    // ------------------------------------------------------------------------
    // Step 6: Compute aggregate KPI counts for the teacher's dashboard metrics
    // ------------------------------------------------------------------------
    const countRow = db
      .prepare(`
        SELECT
          COUNT(*) AS totalAll,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS totalActive,
          SUM(CASE WHEN status = 'Archived' THEN 1 ELSE 0 END) AS totalArchived
        FROM reading_materials
        WHERE teacherId = ?
      `)
      .get(teacher.id) as any;

    const counts = {
      all: countRow?.totalAll || 0,
      active: countRow?.totalActive || 0,
      archived: countRow?.totalArchived || 0,
    };

    return NextResponse.json({
      success: true,
      materials,
      counts,
    });
  } catch (error) {
    console.error('Error fetching reading materials:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching reading materials.' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// POST: Create a new reading passage (reference text for assessments)
// ----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // Step 1: Verify teacher session authentication
    // ------------------------------------------------------------------------
    const teacher = await getAuthenticatedTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as a teacher to create reading materials.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 2: Parse and sanitize incoming JSON payload
    // ------------------------------------------------------------------------
    const body = await request.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const rawContent = (body.content || '').trim();
    const difficulty = (body.difficulty || 'Easy').trim();
    const gradeLevel = (body.gradeLevel || 'Grade 3').trim();

    // ------------------------------------------------------------------------
    // Step 3: Validate required input fields
    // ------------------------------------------------------------------------
    if (!title) {
      return NextResponse.json(
        { error: 'Material title is required.' },
        { status: 400 }
      );
    }

    if (title.length < 2 || title.length > 120) {
      return NextResponse.json(
        { error: 'Material title must be between 2 and 120 characters long.' },
        { status: 400 }
      );
    }

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Reading content cannot be empty.' },
        { status: 400 }
      );
    }

    // Validate difficulty level against allowed values
    const validDifficulties = ['Easy', 'Moderate', 'Difficult'];
    const validatedDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'Easy';

    // Validate grade level against allowed values (Grade 1 through Grade 6)
    const validatedGradeLevel = ALLOWED_GRADE_LEVELS.includes(gradeLevel) ? gradeLevel : 'Grade 3';

    // ------------------------------------------------------------------------
    // Step 4: Calculate word count for the reading passage
    // ------------------------------------------------------------------------
    // The word count represents the total reference words in the passage.
    // During a future assessment, this count will be the denominator for
    // calculating the reading percentage: (correct words / total words) × 100.
    const wordCount = computePassageWordCount(rawContent);

    if (wordCount === 0) {
      return NextResponse.json(
        { error: 'Reading passage must contain at least one readable word.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 5: Insert the reading passage record into SQLite
    // ------------------------------------------------------------------------
    const materialId = uuidv4();
    const nowIso = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO reading_materials (
        id,
        teacherId,
        title,
        description,
        type,
        content,
        wordCount,
        difficulty,
        gradeLevel,
        status,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, 'Passage', ?, ?, ?, ?, 'Active', ?, ?)
    `);

    insertStmt.run(
      materialId,
      teacher.id,
      title,
      description || null,
      rawContent,
      wordCount,
      validatedDifficulty,
      validatedGradeLevel,
      nowIso,
      nowIso
    );

    // Retrieve the freshly created material record.
    const createdMaterial = db
      .prepare('SELECT * FROM reading_materials WHERE id = ?')
      .get(materialId);

    return NextResponse.json(
      {
        success: true,
        message: 'Reading passage created successfully.',
        material: createdMaterial,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reading material:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating reading material.' },
      { status: 500 }
    );
  }
}
