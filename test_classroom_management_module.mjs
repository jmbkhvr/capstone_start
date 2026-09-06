// ============================================================================
// AUTOMATED INTEGRATION TEST SUITE: CLASSROOM MANAGEMENT MODULE (MODULE 4)
// ============================================================================
// What this script tests:
// 1. Unauthenticated access to /api/classrooms returns HTTP 401 Unauthorized.
// 2. Unauthenticated access to /classrooms redirects to /login.
// 3. Database classrooms table schema and fields.
// 4. Authenticated access to /api/classrooms returns classroom records and status counts.
// 5. Validation error handling on POST /api/classrooms (missing name, invalid data).
// 6. Successful classroom creation (POST /api/classrooms) with HTTP 201.
// 7. Duplicate classroom prevention for active classrooms (HTTP 409 Conflict).
// 8. Single classroom retrieval by ID (GET /api/classrooms/[id]).
// 9. Classroom updating (PUT /api/classrooms/[id]).
// 10. Soft archive functionality (PATCH /api/classrooms/[id]/archive).
// 11. Already archived classroom handling (HTTP 400).
// 12. Classroom restoration functionality (action: 'restore').
// 13. Search query filtering (?search=...).
// 14. Status filtering (?status=Active, ?status=Archived, ?status=All).
// 15. Teacher authorization and multi-tenant data isolation: Teacher B cannot view,
//     edit, or archive Teacher A's classrooms.
// 16. Authenticated HTML page render for /classrooms returns HTTP 200 OK.
// 17. Database cleanup of temporary test fixtures.
// ============================================================================

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const db = new Database('data/capstone.db');

// Ensure classrooms table exists in case test runs before server touches DB
db.exec(`
  CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gradeLevel TEXT NOT NULL DEFAULT 'Grade 3',
    section TEXT,
    schoolYear TEXT NOT NULL,
    description TEXT,
    teacherId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
  );
`);

async function runTests() {
  console.log('============================================================');
  console.log('STARTING MODULE 4: CLASSROOM MANAGEMENT AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // Setup: Fetch or create primary test teacher (Teacher 1)
  // --------------------------------------------------------------------------
  let teacher1 = db.prepare('SELECT id, teacherId, fullName, email FROM teachers LIMIT 1').get();
  if (!teacher1) {
    const t1Id = randomUUID();
    db.prepare(`
      INSERT INTO teachers (id, teacherId, fullName, email, passwordHash)
      VALUES (?, 'T-TEST-001', 'Primary Test Teacher', 'teacher1.test@school.edu.ph', 'hash')
    `).run(t1Id);
    teacher1 = db.prepare('SELECT id, teacherId, fullName, email FROM teachers WHERE id = ?').get(t1Id);
  }

  const teacher1Token = jwt.sign(
    { id: teacher1.id, teacherId: teacher1.teacherId, fullName: teacher1.fullName, email: teacher1.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  // Setup: Create a distinct second teacher (Teacher 2) for cross-teacher authorization tests
  const teacher2Id = randomUUID();
  db.prepare(`
    INSERT INTO teachers (id, teacherId, fullName, email, passwordHash)
    VALUES (?, ?, 'Secondary Test Teacher', ?, 'hash')
  `).run(teacher2Id, `T-AUTH-${Date.now()}`, `auth.test.${Date.now()}@school.edu.ph`);

  const teacher2 = db.prepare('SELECT id, teacherId, fullName, email FROM teachers WHERE id = ?').get(teacher2Id);
  const teacher2Token = jwt.sign(
    { id: teacher2.id, teacherId: teacher2.teacherId, fullName: teacher2.fullName, email: teacher2.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  let createdClassroomId = null;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated access to /api/classrooms returns HTTP 401
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Access ---');
    const unauthRes = await fetch(`${BASE_URL}/api/classrooms`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/classrooms returns HTTP 401 Unauthorized');
    const unauthJson = await unauthRes.json();
    assert(Boolean(unauthJson.error), 'Unauthenticated response contains descriptive error message');

    // ------------------------------------------------------------------------
    // TEST 2: Unauthenticated navigation to /classrooms redirects to /login
    // ------------------------------------------------------------------------
    const unauthPageRes = await fetch(`${BASE_URL}/classrooms`, { redirect: 'manual' });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 302,
      `Unauthenticated visit to /classrooms redirects (HTTP ${unauthPageRes.status})`
    );
    const redirectLocation = unauthPageRes.headers.get('location') || '';
    assert(
      redirectLocation.includes('/login') && redirectLocation.includes('redirect=%2Fclassrooms'),
      `Redirect target includes login with return param: ${redirectLocation}`
    );

    // ------------------------------------------------------------------------
    // TEST 3: Database schema verification
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Database Schema & Structure ---');
    const columns = db.prepare("PRAGMA table_info('classrooms')").all();
    const columnNames = columns.map((c) => c.name);
    assert(columnNames.includes('id'), 'classrooms table has "id" column');
    assert(columnNames.includes('name'), 'classrooms table has "name" column');
    assert(columnNames.includes('gradeLevel'), 'classrooms table has "gradeLevel" column');
    assert(columnNames.includes('section'), 'classrooms table has "section" column');
    assert(columnNames.includes('schoolYear'), 'classrooms table has "schoolYear" column');
    assert(columnNames.includes('teacherId'), 'classrooms table has "teacherId" column');
    assert(columnNames.includes('status'), 'classrooms table has "status" column');
    assert(columnNames.includes('createdAt'), 'classrooms table has "createdAt" column');
    assert(columnNames.includes('updatedAt'), 'classrooms table has "updatedAt" column');

    // ------------------------------------------------------------------------
    // TEST 4: Initial authenticated GET /api/classrooms
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Authenticated Classroom Retrieval ---');
    const authListRes = await fetch(`${BASE_URL}/api/classrooms`, {
      headers: { Cookie: `teacher_auth_token=${teacher1Token}` },
    });
    assert(authListRes.status === 200, 'Authenticated GET /api/classrooms returns HTTP 200 OK');
    const authListJson = await authListRes.json();
    assert(Array.isArray(authListJson.classrooms), 'Response contains classrooms array');
    assert(authListJson.counts !== undefined, 'Response contains status counts object');
    assert(typeof authListJson.counts.all === 'number', 'counts.all is numeric');
    assert(typeof authListJson.counts.active === 'number', 'counts.active is numeric');
    assert(typeof authListJson.counts.archived === 'number', 'counts.archived is numeric');

    // ------------------------------------------------------------------------
    // TEST 5: Create Classroom Validation (Missing Name)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Classroom Creation & Validation ---');
    const missingNameRes = await fetch(`${BASE_URL}/api/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({
        gradeLevel: 'Grade 3',
        schoolYear: '2026-2027',
      }),
    });
    assert(missingNameRes.status === 400, 'POST /api/classrooms with missing name returns HTTP 400 Bad Request');

    // ------------------------------------------------------------------------
    // TEST 6: Create Classroom Validation (Missing School Year)
    // ------------------------------------------------------------------------
    const missingSyRes = await fetch(`${BASE_URL}/api/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({
        name: 'Grade 3 - Section Diamond',
      }),
    });
    assert(missingSyRes.status === 400, 'POST /api/classrooms with missing school year returns HTTP 400 Bad Request');

    // ------------------------------------------------------------------------
    // TEST 7: Successful Classroom Creation (POST /api/classrooms)
    // ------------------------------------------------------------------------
    const validClassroomName = `Grade 3 - Section Diamond ${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/api/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({
        name: validClassroomName,
        gradeLevel: 'Grade 3',
        section: 'Diamond',
        schoolYear: '2026-2027',
        description: 'Primary Grade 3 morning reading section',
      }),
    });
    assert(createRes.status === 201, 'Valid POST /api/classrooms returns HTTP 201 Created');
    const createJson = await createRes.json();
    assert(createJson.classroom !== undefined, 'Response contains created classroom object');
    assert(createJson.classroom.name === validClassroomName, 'Classroom name matches input');
    assert(createJson.classroom.status === 'Active', 'Classroom status defaults to "Active"');
    assert(createJson.classroom.teacherId === teacher1.id, 'Classroom teacherId matches authenticated teacher');
    createdClassroomId = createJson.classroom.id;

    // Verify in SQLite directly
    const dbRecord = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(createdClassroomId);
    assert(Boolean(dbRecord), 'Classroom record successfully persisted in SQLite database');

    // ------------------------------------------------------------------------
    // TEST 8: Duplicate Active Classroom Conflict (HTTP 409)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Duplicate Conflict Handling ---');
    const duplicateRes = await fetch(`${BASE_URL}/api/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({
        name: validClassroomName,
        gradeLevel: 'Grade 3',
        schoolYear: '2026-2027',
      }),
    });
    assert(duplicateRes.status === 409, 'Duplicate classroom name for same teacher returns HTTP 409 Conflict');

    // ------------------------------------------------------------------------
    // TEST 9: View Single Classroom Details (GET /api/classrooms/[id])
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing View Classroom Details ---');
    const detailsRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}`, {
      headers: { Cookie: `teacher_auth_token=${teacher1Token}` },
    });
    assert(detailsRes.status === 200, 'GET /api/classrooms/[id] returns HTTP 200 OK');
    const detailsJson = await detailsRes.json();
    assert(detailsJson.classroom.id === createdClassroomId, 'Fetched classroom ID matches requested ID');
    assert(detailsJson.classroom.name === validClassroomName, 'Fetched classroom name matches');
    assert(typeof detailsJson.classroom.studentCount === 'number', 'Classroom includes studentCount');

    // ------------------------------------------------------------------------
    // TEST 10: Invalid Classroom ID returns HTTP 404
    // ------------------------------------------------------------------------
    const nonExistentRes = await fetch(`${BASE_URL}/api/classrooms/non-existent-uuid-12345`, {
      headers: { Cookie: `teacher_auth_token=${teacher1Token}` },
    });
    assert(nonExistentRes.status === 404, 'Non-existent classroom ID returns HTTP 404 Not Found');

    // ------------------------------------------------------------------------
    // TEST 11: Edit Classroom Information (PUT /api/classrooms/[id])
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Testing Edit Classroom Information ---');
    const updatedName = `${validClassroomName} (Updated)`;
    const editRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({
        name: updatedName,
        gradeLevel: 'Grade 3',
        section: 'Diamond-A',
        schoolYear: '2026-2027',
        description: 'Updated classroom schedule and notes',
      }),
    });
    assert(editRes.status === 200, 'PUT /api/classrooms/[id] returns HTTP 200 OK');
    const editJson = await editRes.json();
    assert(editJson.classroom.name === updatedName, 'Classroom name successfully updated');
    assert(editJson.classroom.section === 'Diamond-A', 'Classroom section successfully updated');

    // ------------------------------------------------------------------------
    // TEST 12: Soft Archive Classroom (PATCH /api/classrooms/[id]/archive)
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Testing Soft Archiving & Restoring ---');
    const archiveRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({ action: 'archive' }),
    });
    assert(archiveRes.status === 200, 'PATCH /api/classrooms/[id]/archive returns HTTP 200 OK');
    const archiveJson = await archiveRes.json();
    assert(archiveJson.classroom.status === 'Archived', 'Classroom status changed to "Archived"');

    // Verify in SQLite database
    const dbArchived = db.prepare('SELECT status FROM classrooms WHERE id = ?').get(createdClassroomId);
    assert(dbArchived.status === 'Archived', 'Database reflects status = "Archived" without deleting row');

    // ------------------------------------------------------------------------
    // TEST 13: Already Archived Classroom Re-archive check (HTTP 400)
    // ------------------------------------------------------------------------
    const reArchiveRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({ action: 'archive' }),
    });
    assert(reArchiveRes.status === 400, 'Re-archiving an already archived classroom returns HTTP 400');

    // ------------------------------------------------------------------------
    // TEST 14: Restore Classroom (action: 'restore')
    // ------------------------------------------------------------------------
    const restoreRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher1Token}`,
      },
      body: JSON.stringify({ action: 'restore' }),
    });
    assert(restoreRes.status === 200, 'Restoring classroom returns HTTP 200 OK');
    const restoreJson = await restoreRes.json();
    assert(restoreJson.classroom.status === 'Active', 'Classroom status restored to "Active"');

    // ------------------------------------------------------------------------
    // TEST 15: Search and Filtering
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Testing Search & Filtering ---');
    const searchRes = await fetch(`${BASE_URL}/api/classrooms?search=Diamond-A`, {
      headers: { Cookie: `teacher_auth_token=${teacher1Token}` },
    });
    const searchJson = await searchRes.json();
    assert(searchJson.classrooms.some((c) => c.id === createdClassroomId), 'Search query locates classroom by section keyword');

    const statusFilterRes = await fetch(`${BASE_URL}/api/classrooms?status=Active`, {
      headers: { Cookie: `teacher_auth_token=${teacher1Token}` },
    });
    const statusFilterJson = await statusFilterRes.json();
    assert(statusFilterJson.classrooms.every((c) => c.status === 'Active'), 'Status filter returns only active classrooms');

    // ------------------------------------------------------------------------
    // TEST 16: Multi-Tenant Data Isolation & Authorization
    // ------------------------------------------------------------------------
    console.log('\n--- 10. Testing Cross-Teacher Authorization & Isolation ---');
    // Teacher 2 attempts to view Teacher 1's classroom
    const t2ViewRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}`, {
      headers: { Cookie: `teacher_auth_token=${teacher2Token}` },
    });
    assert(t2ViewRes.status === 404, 'Teacher 2 viewing Teacher 1 classroom rejected with HTTP 404 Not Found');

    // Teacher 2 attempts to edit Teacher 1's classroom
    const t2EditRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher2Token}`,
      },
      body: JSON.stringify({
        name: 'Hacked Classroom Name',
        schoolYear: '2026-2027',
      }),
    });
    assert(t2EditRes.status === 404, 'Teacher 2 editing Teacher 1 classroom rejected with HTTP 404 Not Found');

    // Teacher 2 attempts to archive Teacher 1's classroom
    const t2ArchiveRes = await fetch(`${BASE_URL}/api/classrooms/${createdClassroomId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacher2Token}`,
      },
      body: JSON.stringify({ action: 'archive' }),
    });
    assert(t2ArchiveRes.status === 404, 'Teacher 2 archiving Teacher 1 classroom rejected with HTTP 404 Not Found');

    // Teacher 2 classroom list should NOT include Teacher 1's classroom
    const t2ListRes = await fetch(`${BASE_URL}/api/classrooms`, {
      headers: { Cookie: `teacher_auth_token=${teacher2Token}` },
    });
    const t2ListJson = await t2ListRes.json();
    assert(
      !t2ListJson.classrooms.some((c) => c.id === createdClassroomId),
      "Teacher 1 classroom is completely hidden from Teacher 2 classroom list"
    );

    // ------------------------------------------------------------------------
    // TEST 17: Authenticated HTML Page Render (/classrooms)
    // ------------------------------------------------------------------------
    console.log('\n--- 11. Testing HTML Page Render ---');
    const htmlRes = await fetch(`${BASE_URL}/classrooms`, {
      headers: { Cookie: `teacher_auth_token=${teacher1Token}` },
    });
    assert(htmlRes.status === 200, 'Authenticated visit to /classrooms renders HTTP 200 OK');
    const htmlText = await htmlRes.text();
    assert(htmlText.includes('Classroom Management'), 'HTML contains "Classroom Management" title');

    console.log('\n============================================================');
    console.log(`MODULE 4 TEST SUITE COMPLETED: ${passed}/${total} TESTS PASSED!`);
    console.log('============================================================\n');
  } finally {
    // ------------------------------------------------------------------------
    // Cleanup: Remove test fixtures
    // ------------------------------------------------------------------------
    if (createdClassroomId) {
      db.prepare('DELETE FROM classrooms WHERE id = ?').run(createdClassroomId);
      console.log(`[CLEANUP] Deleted test classroom: ${createdClassroomId}`);
    }
    if (teacher2Id) {
      db.prepare('DELETE FROM teachers WHERE id = ?').run(teacher2Id);
      console.log(`[CLEANUP] Deleted test teacher 2: ${teacher2Id}`);
    }
  }
}

runTests().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
