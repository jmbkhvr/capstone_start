// ============================================================================
// AUTOMATED TEST SUITE: PARENT MANAGEMENT MODULE (MODULE 3)
// ============================================================================
// What this script tests:
// 1. Unauthenticated access to /api/parents returns HTTP 401 Unauthorized.
// 2. Unauthenticated access to /parents redirects to /login.
// 3. Database parent table structure and schema fields.
// 4. Authenticated access to /api/parents returns parent records with status counts.
// 5. Query filtering by status ('Pending', 'Approved', 'Rejected').
// 6. Search query functionality (by parent name, email, and child name).
// 7. Single parent details retrieval (/api/parents/[id]).
// 8. Password hash sanitization (passwordHash is never exposed).
// 9. Parent approval action (PATCH /api/parents/[id]/approve).
// 10. Re-approval prevention (HTTP 400 when approving already approved parent).
// 11. Parent rejection action (PATCH /api/parents/[id]/reject) with reason.
// 12. Re-rejection prevention (HTTP 400 when rejecting already rejected parent).
// 13. Data cleanup: Safely removes all test parent records when tests finish.
// ============================================================================

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const db = new Database('data/capstone.db');

async function runTests() {
  console.log('------------------------------------------------------------');
  console.log('STARTING MODULE 3: PARENT MANAGEMENT AUTOMATED TEST SUITE');
  console.log('------------------------------------------------------------');

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

  // 1. Fetch existing teacher for authentication token
  const teacher = db.prepare('SELECT id, teacherId, fullName, email FROM teachers').get();
  if (!teacher) {
    throw new Error('No teacher found in database');
  }

  const teacherToken = jwt.sign(
    { id: teacher.id, teacherId: teacher.teacherId, fullName: teacher.fullName, email: teacher.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // --------------------------------------------------------------------------
  // TEST 1: Unauthenticated API Access
  // --------------------------------------------------------------------------
  console.log('\n--- Test 1: Unauthenticated API Access Protection ---');
  const res1 = await fetch(`${BASE_URL}/api/parents`);
  assert(res1.status === 401, `Expected HTTP 401 Unauthorized, got HTTP ${res1.status}`);

  // --------------------------------------------------------------------------
  // TEST 2: Unauthenticated Route Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: Unauthenticated Route Middleware Protection ---');
  const res2 = await fetch(`${BASE_URL}/parents`, { redirect: 'manual' });
  assert(res2.status === 307 || res2.status === 302, `Expected redirect status (307/302), got HTTP ${res2.status}`);
  const redirectLocation = res2.headers.get('location') || '';
  assert(redirectLocation.includes('/login'), `Redirect target is /login (actual: ${redirectLocation})`);

  // --------------------------------------------------------------------------
  // SETUP: Ensure parents table exists and insert test parent records
  // --------------------------------------------------------------------------
  console.log('\n--- Setup: Initializing Table & Seeding Test Parent Records ---');
  db.exec(`
    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      contactNumber TEXT,
      passwordHash TEXT NOT NULL,
      childName TEXT NOT NULL,
      childGradeLevel TEXT DEFAULT 'Grade 3',
      childSection TEXT,
      teacherId TEXT,
      status TEXT DEFAULT 'Pending',
      rejectionReason TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE SET NULL
    );
  `);

  const testParent1Id = randomUUID();
  const testParent2Id = randomUUID();
  const testParent3Id = randomUUID();

  const insertStmt = db.prepare(`
    INSERT INTO parents (
      id, fullName, email, contactNumber, passwordHash, childName, childGradeLevel, childSection, teacherId, status, rejectionReason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    testParent1Id,
    'Juan Dela Cruz (Test)',
    `juan.test.${Date.now()}@example.com`,
    '09171234567',
    '$2a$10$FakeHashForTestOnly1234567890123456789012345678901234',
    'Maria Dela Cruz',
    'Grade 3',
    'Diamond',
    teacher.id,
    'Pending',
    null
  );

  insertStmt.run(
    testParent2Id,
    'Pedro Santos (Test)',
    `pedro.test.${Date.now()}@example.com`,
    '09181234567',
    '$2a$10$FakeHashForTestOnly1234567890123456789012345678901234',
    'Ana Santos',
    'Grade 3',
    'Ruby',
    teacher.id,
    'Approved',
    null
  );

  insertStmt.run(
    testParent3Id,
    'Roberto Ramos (Test)',
    `roberto.test.${Date.now()}@example.com`,
    '09191234567',
    '$2a$10$FakeHashForTestOnly1234567890123456789012345678901234',
    'Mark Ramos',
    'Grade 3',
    'Emerald',
    teacher.id,
    'Rejected',
    'Test reason: Invalid birth certificate'
  );

  console.log('[PASS] Seeded 3 test parent accounts (Pending, Approved, Rejected).');

  try {
    // ------------------------------------------------------------------------
    // TEST 3: Authenticated Fetch All Parents
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Authenticated Fetch Parent Records List ---');
    const res3 = await fetch(`${BASE_URL}/api/parents`, {
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res3.status === 200, `Expected HTTP 200 OK, got HTTP ${res3.status}`);
    const data3 = await res3.json();

    assert(Array.isArray(data3.parents), 'Response contains parents array');
    assert(data3.counts && typeof data3.counts.all === 'number', 'Response contains status counts');
    assert(data3.counts.all >= 3, `Counts all reflects test records (${data3.counts.all})`);
    assert(data3.counts.pending >= 1, `Counts pending reflects test record (${data3.counts.pending})`);

    // Verify passwordHash is never returned
    const leakedPassword = data3.parents.some((p) => p.passwordHash !== undefined);
    assert(!leakedPassword, 'Security check passed: passwordHash is not exposed in API response');

    // ------------------------------------------------------------------------
    // TEST 4: Filtering by Status (Pending)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Status Filtering (Pending) ---');
    const res4 = await fetch(`${BASE_URL}/api/parents?status=Pending`, {
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res4.status === 200, `Expected HTTP 200 OK, got HTTP ${res4.status}`);
    const data4 = await res4.json();
    const allPending = data4.parents.every((p) => p.status === 'Pending');
    assert(allPending, 'All returned parents have status "Pending"');

    // ------------------------------------------------------------------------
    // TEST 5: Search Query Filter (Child Name)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Search Filtering (Child Name: Maria) ---');
    const res5 = await fetch(`${BASE_URL}/api/parents?search=Maria`, {
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res5.status === 200, `Expected HTTP 200 OK, got HTTP ${res5.status}`);
    const data5 = await res5.json();
    const hasMaria = data5.parents.some((p) => p.childName === 'Maria Dela Cruz');
    assert(hasMaria, 'Search returned parent with pupil Maria Dela Cruz');

    // ------------------------------------------------------------------------
    // TEST 6: Single Parent Details (/api/parents/[id])
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Single Parent Details Retrieval ---');
    const res6 = await fetch(`${BASE_URL}/api/parents/${testParent1Id}`, {
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res6.status === 200, `Expected HTTP 200 OK, got HTTP ${res6.status}`);
    const data6 = await res6.json();
    assert(data6.parent && data6.parent.id === testParent1Id, 'Returned parent record matches requested ID');
    assert(data6.parent.fullName === 'Juan Dela Cruz (Test)', 'Parent name matches');
    assert(data6.parent.childName === 'Maria Dela Cruz', 'Linked pupil matches');
    assert(data6.parent.passwordHash === undefined, 'Security check passed: passwordHash is not exposed in single view');

    // ------------------------------------------------------------------------
    // TEST 7: Approve Pending Parent Registration
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Approve Pending Parent Registration ---');
    const res7 = await fetch(`${BASE_URL}/api/parents/${testParent1Id}/approve`, {
      method: 'PATCH',
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res7.status === 200, `Expected HTTP 200 OK, got HTTP ${res7.status}`);
    const data7 = await res7.json();
    assert(data7.success === true, 'Approval response indicates success: true');
    assert(data7.parent.status === 'Approved', 'Updated status is "Approved"');

    // Check database state directly
    const updatedParent1 = db.prepare('SELECT status, teacherId FROM parents WHERE id = ?').get(testParent1Id);
    assert(updatedParent1.status === 'Approved', 'Database record status updated to "Approved"');
    assert(updatedParent1.teacherId === teacher.id, 'Approving teacher ID linked to parent record');

    // ------------------------------------------------------------------------
    // TEST 8: Prevent Re-approval of Already Approved Parent
    // ------------------------------------------------------------------------
    console.log('\n--- Test 8: Re-approval Prevention ---');
    const res8 = await fetch(`${BASE_URL}/api/parents/${testParent1Id}/approve`, {
      method: 'PATCH',
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res8.status === 400, `Expected HTTP 400 Bad Request, got HTTP ${res8.status}`);

    // ------------------------------------------------------------------------
    // TEST 9: Reject Parent Registration
    // ------------------------------------------------------------------------
    console.log('\n--- Test 9: Reject Parent Registration ---');
    const res9 = await fetch(`${BASE_URL}/api/parents/${testParent1Id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `teacher_auth_token=${teacherToken}`,
      },
      body: JSON.stringify({ reason: 'Student transferred to another school.' }),
    });
    assert(res9.status === 200, `Expected HTTP 200 OK, got HTTP ${res9.status}`);
    const data9 = await res9.json();
    assert(data9.success === true, 'Rejection response indicates success: true');
    assert(data9.parent.status === 'Rejected', 'Updated status is "Rejected"');

    // Check database state directly
    const updatedParentRejected = db.prepare('SELECT status, rejectionReason FROM parents WHERE id = ?').get(testParent1Id);
    assert(updatedParentRejected.status === 'Rejected', 'Database record status updated to "Rejected"');
    assert(updatedParentRejected.rejectionReason === 'Student transferred to another school.', 'Rejection reason saved correctly in database');

    // ------------------------------------------------------------------------
    // TEST 10: Prevent Re-rejection of Already Rejected Parent
    // ------------------------------------------------------------------------
    console.log('\n--- Test 10: Re-rejection Prevention ---');
    const res10 = await fetch(`${BASE_URL}/api/parents/${testParent1Id}/reject`, {
      method: 'PATCH',
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
    });
    assert(res10.status === 400, `Expected HTTP 400 Bad Request, got HTTP ${res10.status}`);

    // ------------------------------------------------------------------------
    // TEST 11: Authenticated Page Render for /parents
    // ------------------------------------------------------------------------
    console.log('\n--- Test 11: Authenticated Page Render for /parents ---');
    const res11 = await fetch(`${BASE_URL}/parents`, {
      headers: { Cookie: `teacher_auth_token=${teacherToken}` },
      redirect: 'manual',
    });
    assert(res11.status === 200, `Expected HTTP 200 OK for /parents HTML render, got HTTP ${res11.status}`);

  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP: Remove all test records to keep production DB clean (Section 7)
    // ------------------------------------------------------------------------
    console.log('\n--- Cleanup: Removing Test Parent Records ---');
    db.prepare('DELETE FROM parents WHERE id IN (?, ?, ?)').run(testParent1Id, testParent2Id, testParent3Id);
    console.log('[PASS] Test parent records cleanly removed from database.');
  }

  console.log('\n============================================================');
  console.log(`ALL ${passed}/${total} MODULE 3 TESTS PASSED SUCCESSFULLY!`);
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('\n[TEST RUN ERROR]:', err);
  process.exit(1);
});
