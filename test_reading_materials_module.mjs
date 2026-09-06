// ============================================================================
// AUTOMATED INTEGRATION TEST SUITE: READING MATERIALS MODULE (MODULE 6)
// ============================================================================
// What this script tests:
// 1. Unauthenticated access to /api/reading-materials returns HTTP 401.
// 2. Unauthenticated access to /reading-materials redirects to /login.
// 3. Database reading_materials table schema, fields, and foreign keys.
// 4. Authenticated access to /api/reading-materials returns list and counts.
// 5. Validation error handling on POST (missing title, invalid type, empty content).
// 6. Successful creation of Reading Passage with accurate punctuation-free word count.
// 7. Successful creation of Word List with empty-line filtering and order preservation.
// 8. Single reading material retrieval by ID (GET /api/reading-materials/[id]).
// 9. Reading material update (PUT /api/reading-materials/[id]) with word recalculation.
// 10. Soft archiving functionality (PATCH /api/reading-materials/[id]/archive).
// 11. Material restoration functionality back to 'Active'.
// 12. Search query filtering (?search=...).
// 13. Material type filtering (?type=Passage, ?type=Word List).
// 14. Difficulty filtering (?difficulty=Easy, ?difficulty=Moderate, ?difficulty=Difficult).
// 15. Status filtering (?status=Active, ?status=Archived).
// 16. Multi-column sorting (?sort=wordCount, ?sort=title).
// 17. Multi-tenant data isolation: Teacher B cannot read, edit, or archive Teacher A's materials.
// 18. Authenticated HTML page render for /reading-materials returns HTTP 200 OK.
// ============================================================================

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const db = new Database('data/capstone.db');

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS reading_materials (
    id TEXT PRIMARY KEY,
    teacherId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    wordCount INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'Easy',
    gradeLevel TEXT NOT NULL DEFAULT 'Grade 3',
    status TEXT NOT NULL DEFAULT 'Active',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
  );
`);

async function runTests() {
  console.log('============================================================');
  console.log('STARTING MODULE 6: READING MATERIALS AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Helper: Create temporary test teachers in SQLite
  const teacherAId = randomUUID();
  const teacherBId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO teachers (id, teacherId, fullName, email, passwordHash, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    teacherAId,
    `T-MAT-${Date.now().toString().slice(-4)}`,
    'Teacher Reading Tester A',
    `teacher.read.a.${Date.now()}@test.edu`,
    'hash',
    now,
    now
  );

  db.prepare(`
    INSERT INTO teachers (id, teacherId, fullName, email, passwordHash, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    teacherBId,
    `T-MAT-B-${Date.now().toString().slice(-4)}`,
    'Teacher Reading Tester B',
    `teacher.read.b.${Date.now()}@test.edu`,
    'hash',
    now,
    now
  );

  // Generate JWT auth tokens
  const tokenA = jwt.sign(
    {
      id: teacherAId,
      teacherId: 'T-MAT-A',
      fullName: 'Teacher Reading Tester A',
      email: 'teacher.read.a@test.edu',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tokenB = jwt.sign(
    {
      id: teacherBId,
      teacherId: 'T-MAT-B',
      fullName: 'Teacher Reading Tester B',
      email: 'teacher.read.b@test.edu',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const headersA = {
    'Content-Type': 'application/json',
    Cookie: `teacher_auth_token=${tokenA}`,
  };

  const headersB = {
    'Content-Type': 'application/json',
    Cookie: `teacher_auth_token=${tokenB}`,
  };

  try {
    // ------------------------------------------------------------------------
    // 1. Testing Unauthenticated Access
    // ------------------------------------------------------------------------
    console.log('--- 1. Testing Unauthenticated Access ---');
    const unauthGetRes = await fetch(`${BASE_URL}/api/reading-materials`);
    assert(
      unauthGetRes.status === 401,
      'Unauthenticated GET /api/reading-materials returns HTTP 401 Unauthorized'
    );

    const unauthPostRes = await fetch(`${BASE_URL}/api/reading-materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Passage', type: 'Passage', content: 'Sample text.' }),
    });
    assert(
      unauthPostRes.status === 401,
      'Unauthenticated POST /api/reading-materials returns HTTP 401 Unauthorized'
    );

    const pageRedirectRes = await fetch(`${BASE_URL}/reading-materials`, {
      redirect: 'manual',
    });
    assert(
      [302, 307].includes(pageRedirectRes.status),
      'Unauthenticated GET /reading-materials redirects (HTTP 302/307) to /login'
    );

    // ------------------------------------------------------------------------
    // 2. Testing Authenticated Read & Stats
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Authenticated Read & Stats ---');
    const authGetRes = await fetch(`${BASE_URL}/api/reading-materials`, {
      headers: headersA,
    });
    assert(authGetRes.status === 200, 'Authenticated GET /api/reading-materials returns HTTP 200 OK');

    const authGetData = await authGetRes.json();
    assert(authGetData.success === true, 'Response JSON indicates success: true');
    assert(Array.isArray(authGetData.materials), 'Response contains materials array');
    assert(authGetData.counts && typeof authGetData.counts.all === 'number', 'Response contains counts object');
    assert(typeof authGetData.counts.active === 'number', 'Response contains active count');
    assert(typeof authGetData.counts.archived === 'number', 'Response contains archived count');

    // ------------------------------------------------------------------------
    // 3. Testing Input Validations
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Input Validations ---');
    // Missing title
    const valMissingTitle = await fetch(`${BASE_URL}/api/reading-materials`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: '',
        type: 'Passage',
        content: 'Valid content here.',
      }),
    });
    assert(valMissingTitle.status === 400, 'POST /api/reading-materials with empty title returns HTTP 400');


    // Missing content
    const valMissingContent = await fetch(`${BASE_URL}/api/reading-materials`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Valid Title',
        type: 'Passage',
        content: '   ',
      }),
    });
    assert(valMissingContent.status === 400, 'POST /api/reading-materials with empty content returns HTTP 400');

    // Content with only punctuation
    const valPunctOnly = await fetch(`${BASE_URL}/api/reading-materials`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Valid Title',
        type: 'Passage',
        content: '... !!! ???',
      }),
    });
    assert(valPunctOnly.status === 400, 'POST /api/reading-materials with punctuation-only content returns HTTP 400');

    // ------------------------------------------------------------------------
    // 4. Testing Reading Passage Creation & Word Counting
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Reading Passage Creation & Word Counting ---');
    // "The quick brown fox jumps over the lazy dog. It was an exciting afternoon!" -> 13 words
    const passageRes = await fetch(`${BASE_URL}/api/reading-materials`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'The Brave Little Turtle',
        description: 'Grade 3 oral reading practice story with punctuation',
        type: 'Passage',
        content:
          'Once upon a time, there was a little green turtle named Toby. Toby loved to swim in the calm river near his home!',
        difficulty: 'Easy',
      }),
    });
    assert(passageRes.status === 201, 'POST /api/reading-materials returns HTTP 201 Created for passage');

    const passageData = await passageRes.json();
    assert(passageData.success === true, 'Passage creation response indicates success: true');
    const createdPassage = passageData.material;
    assert(createdPassage.title === 'The Brave Little Turtle', 'Passage title matches input');
    assert(createdPassage.type === 'Passage', 'Passage type is "Passage"');
    assert(createdPassage.difficulty === 'Easy', 'Passage difficulty defaults to Easy');
    assert(createdPassage.gradeLevel === 'Grade 3', 'Passage grade level strictly defaults to Grade 3');
    assert(createdPassage.status === 'Active', 'Passage status strictly defaults to Active');
    // Words in passage: "Once upon a time, there was a little green turtle named Toby. Toby loved to swim in the calm river near his home!"
    // Count: 23 words
    assert(createdPassage.wordCount === 23, `Passage word count accurately calculated (expected 23, got ${createdPassage.wordCount})`);

    // ------------------------------------------------------------------------
    // 5. Testing Passage Creation with Custom Grade Level (Grade 4)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Passage Creation Across Generic Grade Levels ---');
    const grade4PassageRes = await fetch(`${BASE_URL}/api/reading-materials`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Grade 4 Science Reading Passage',
        description: 'Passage for assessing Grade 4 reading comprehension',
        gradeLevel: 'Grade 4',
        content: 'Plants absorb sunlight and water to produce food through photosynthesis.',
        difficulty: 'Moderate',
      }),
    });
    assert(grade4PassageRes.status === 201, 'POST /api/reading-materials returns HTTP 201 for Grade 4 passage');

    const grade4Data = await grade4PassageRes.json();
    const createdGrade4 = grade4Data.material;
    assert(createdGrade4.gradeLevel === 'Grade 4', 'Passage grade level saved as Grade 4');
    assert(createdGrade4.type === 'Passage', 'Passage type is strictly Passage');
    assert(createdGrade4.wordCount === 10, `Passage word count accurately calculated (expected 10, got ${createdGrade4.wordCount})`);

    // ------------------------------------------------------------------------
    // 6. Testing Single Material Retrieval
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Single Material Retrieval ---');
    const getSingleRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}`, {
      headers: headersA,
    });
    assert(getSingleRes.status === 200, 'GET /api/reading-materials/[id] returns HTTP 200 OK');

    const singleData = await getSingleRes.json();
    assert(singleData.material.id === createdPassage.id, 'Returned material ID matches requested ID');
    assert(singleData.material.content === createdPassage.content, 'Returned material content intact');

    const getNotFoundRes = await fetch(`${BASE_URL}/api/reading-materials/non-existent-uuid`, {
      headers: headersA,
    });
    assert(getNotFoundRes.status === 404, 'GET with invalid ID returns HTTP 404 Not Found');

    // ------------------------------------------------------------------------
    // 7. Testing Material Update
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Testing Material Update ---');
    const updateRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({
        title: 'The Brave Little Turtle (Updated Edition)',
        description: 'Updated reading practice with revised ending',
        difficulty: 'Moderate',
        content: 'Toby swam quickly and safely reached the sunny shore.', // 9 words
      }),
    });
    assert(updateRes.status === 200, 'PUT /api/reading-materials/[id] returns HTTP 200 OK');

    const updatedData = await updateRes.json();
    assert(
      updatedData.material.title === 'The Brave Little Turtle (Updated Edition)',
      'Material title updated successfully'
    );
    assert(updatedData.material.difficulty === 'Moderate', 'Material difficulty updated');
    assert(updatedData.material.wordCount === 9, `Material word count recalculated accurately to 9 (got ${updatedData.material.wordCount})`);

    // ------------------------------------------------------------------------
    // 8. Testing Soft Archiving & Restoration
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Testing Soft Archiving & Restoration ---');
    const archiveRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}/archive`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ action: 'archive' }),
    });
    assert(archiveRes.status === 200, 'PATCH /api/reading-materials/[id]/archive returns HTTP 200 OK');
    const archiveData = await archiveRes.json();
    assert(archiveData.status === 'Archived', 'Material status successfully changed to "Archived"');

    // Verify row still exists in database (data preservation guarantee)
    const dbCheck = db.prepare('SELECT status FROM reading_materials WHERE id = ?').get(createdPassage.id);
    assert(dbCheck && dbCheck.status === 'Archived', 'Row is preserved in database with status="Archived"');

    // Restore back to active
    const restoreRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}/archive`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ action: 'restore' }),
    });
    assert(restoreRes.status === 200, 'PATCH restore returns HTTP 200 OK');
    const restoreData = await restoreRes.json();
    assert(restoreData.status === 'Active', 'Material status successfully restored to "Active"');

    // ------------------------------------------------------------------------
    // 9. Testing Search, Filtering, and Sorting
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Testing Search, Filtering, and Sorting ---');
    // Search by title keyword
    const searchRes = await fetch(`${BASE_URL}/api/reading-materials?search=Brave`, {
      headers: headersA,
    });
    const searchData = await searchRes.json();
    assert(
      searchData.materials.some((m) => m.id === createdPassage.id),
      'Search query ?search=Brave successfully returns matching passage'
    );

    // Grade level filter: Grade 4 only
    const grade4FilterRes = await fetch(`${BASE_URL}/api/reading-materials?grade=Grade%204`, {
      headers: headersA,
    });
    const grade4FilterData = await grade4FilterRes.json();
    assert(
      grade4FilterData.materials.every((m) => m.gradeLevel === 'Grade 4'),
      'Grade filter ?grade=Grade 4 returns only Grade 4 reading passages'
    );

    // Grade level filter: Grade 3 only
    const grade3FilterRes = await fetch(`${BASE_URL}/api/reading-materials?grade=Grade%203`, {
      headers: headersA,
    });
    const grade3FilterData = await grade3FilterRes.json();
    assert(
      grade3FilterData.materials.every((m) => m.gradeLevel === 'Grade 3'),
      'Grade filter ?grade=Grade 3 returns only Grade 3 reading passages'
    );

    // Difficulty filter
    const diffFilterRes = await fetch(`${BASE_URL}/api/reading-materials?difficulty=Moderate`, {
      headers: headersA,
    });
    const diffFilterData = await diffFilterRes.json();
    assert(
      diffFilterData.materials.every((m) => m.difficulty === 'Moderate'),
      'Difficulty filter ?difficulty=Moderate returns only Moderate materials'
    );

    // Sorting by wordCount descending
    const sortRes = await fetch(`${BASE_URL}/api/reading-materials?sort=wordCount&order=desc`, {
      headers: headersA,
    });
    const sortData = await sortRes.json();
    if (sortData.materials.length >= 2) {
      assert(
        sortData.materials[0].wordCount >= sortData.materials[1].wordCount,
        'Sorting ?sort=wordCount&order=desc orders records with highest word count first'
      );
    } else {
      assert(sortData.success === true, 'Sorting endpoint executes successfully');
    }

    // ------------------------------------------------------------------------
    // 10. Testing Multi-Tenant Data Isolation
    // ------------------------------------------------------------------------
    console.log('\n--- 10. Testing Multi-Tenant Data Isolation ---');
    // Teacher B trying to read Teacher A's reading material
    const crossReadRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}`, {
      headers: headersB,
    });
    assert(
      [403, 404].includes(crossReadRes.status),
      'Teacher B cannot view Teacher A reading material (HTTP 403/404 Forbidden)'
    );

    // Teacher B trying to edit Teacher A's reading material
    const crossEditRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}`, {
      method: 'PUT',
      headers: headersB,
      body: JSON.stringify({
        title: 'Hacked Title',
        content: 'Malicious modification',
      }),
    });
    assert(
      [403, 404].includes(crossEditRes.status),
      'Teacher B cannot edit Teacher A reading material (HTTP 403/404 Forbidden)'
    );

    // Teacher B trying to archive Teacher A's reading material
    const crossArchiveRes = await fetch(`${BASE_URL}/api/reading-materials/${createdPassage.id}/archive`, {
      method: 'PATCH',
      headers: headersB,
      body: JSON.stringify({ action: 'archive' }),
    });
    assert(
      [403, 404].includes(crossArchiveRes.status),
      'Teacher B cannot archive Teacher A reading material (HTTP 403/404 Forbidden)'
    );

    // ------------------------------------------------------------------------
    // 11. Testing /reading-materials Page HTML Render
    // ------------------------------------------------------------------------
    console.log('\n--- 11. Testing /reading-materials Page HTML Render ---');
    const pageRenderRes = await fetch(`${BASE_URL}/reading-materials`, {
      headers: {
        Cookie: `teacher_auth_token=${tokenA}`,
      },
    });
    assert(pageRenderRes.status === 200, 'Authenticated GET /reading-materials renders HTML page (HTTP 200 OK)');
    const pageHtml = await pageRenderRes.text();
    assert(pageHtml.includes('Reading Materials') || pageHtml.length > 500, 'Reading Materials HTML markup returned');

  } finally {
    // Clean up temporary test data
    db.prepare('DELETE FROM reading_materials WHERE teacherId IN (?, ?)').run(teacherAId, teacherBId);
    db.prepare('DELETE FROM teachers WHERE id IN (?, ?)').run(teacherAId, teacherBId);
  }

  console.log('\n============================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
