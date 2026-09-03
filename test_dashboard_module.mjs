// ============================================================================
// AUTOMATED TEST SUITE: TEACHER DASHBOARD MODULE (MODULE 2)
// ============================================================================
// What this script tests:
// 1. Unauthenticated access to /api/dashboard returns HTTP 401 Unauthorized.
// 2. Unauthenticated access to /dashboard redirects to /login.
// 3. Authenticated access to /api/dashboard with Teacher A cookie returns HTTP 200
//    and Teacher A profile, summary metrics, and recent assessments.
// 4. Authenticated access to /api/dashboard with Teacher B cookie returns HTTP 200
//    and Teacher B profile (validating strict backend data ownership).
// 5. Structure of all dashboard keys: summary (totalStudents, totalClasses,
//    totalAssessments, studentsNeedingAttention), recentAssessments, performanceOverview.
// ============================================================================

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';
const BASE_URL = 'http://127.0.0.1:3005';

const db = new Database('data/capstone.db');

async function runTests() {
  console.log('------------------------------------------------------------');
  console.log('RUNNING MODULE 2 AUTOMATED TEST SUITE');
  console.log('------------------------------------------------------------');

  const teachers = db.prepare('SELECT id, teacherId, fullName, email FROM teachers').all();
  if (teachers.length === 0) {
    throw new Error('No teachers in database');
  }

  const teacher1 = teachers[0];
  const teacher2 = teachers.length > 1 ? teachers[1] : teachers[0];

  const token1 = jwt.sign(
    { id: teacher1.id, teacherId: teacher1.teacherId, fullName: teacher1.fullName, email: teacher1.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const token2 = jwt.sign(
    { id: teacher2.id, teacherId: teacher2.teacherId, fullName: teacher2.fullName, email: teacher2.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

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
  // TEST 1: Unauthenticated request to /api/dashboard
  // --------------------------------------------------------------------------
  console.log('\n--- Test 1: Unauthenticated API Access Protection ---');
  const res1 = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {},
  });
  assert(res1.status === 401, `Expected HTTP 401 Unauthorized, got HTTP ${res1.status}`);
  const data1 = await res1.json();
  assert(data1.error && data1.error.includes('Unauthorized'), `Received correct error message: "${data1.error}"`);

  // --------------------------------------------------------------------------
  // TEST 2: Unauthenticated request to protected page /dashboard
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: Unauthenticated Route Middleware Protection ---');
  const res2 = await fetch(`${BASE_URL}/dashboard`, {
    redirect: 'manual',
  });
  assert(
    res2.status === 307 || res2.status === 302,
    `Expected redirect status (307/302), got HTTP ${res2.status}`
  );
  const location = res2.headers.get('location') || '';
  assert(location.includes('/login'), `Redirect target is /login (actual: ${location})`);

  // --------------------------------------------------------------------------
  // TEST 3: Authenticated request for Teacher 1
  // --------------------------------------------------------------------------
  console.log('\n--- Test 3: Authenticated Dashboard API Data Retrieval (Teacher 1) ---');
  const res3 = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {
      Cookie: `teacher_auth_token=${token1}`,
    },
  });
  assert(res3.status === 200, `Expected HTTP 200 OK, got HTTP ${res3.status}`);
  const data3 = await res3.json();

  assert(data3.teacher.id === teacher1.id, `Teacher ID matches: ${data3.teacher.id}`);
  assert(data3.teacher.fullName === teacher1.fullName, `Teacher Name matches: ${data3.teacher.fullName}`);
  assert(data3.teacher.email === teacher1.email, `Teacher Email matches: ${data3.teacher.email}`);

  assert(typeof data3.summary.totalStudents === 'number', `summary.totalStudents is number (${data3.summary.totalStudents})`);
  assert(typeof data3.summary.totalClasses === 'number', `summary.totalClasses is number (${data3.summary.totalClasses})`);
  assert(typeof data3.summary.totalAssessments === 'number', `summary.totalAssessments is number (${data3.summary.totalAssessments})`);
  assert(typeof data3.summary.studentsNeedingAttention === 'number', `summary.studentsNeedingAttention is number (${data3.summary.studentsNeedingAttention})`);

  assert(Array.isArray(data3.recentAssessments), `recentAssessments is an array (length: ${data3.recentAssessments.length})`);
  assert(Array.isArray(data3.performanceOverview), `performanceOverview is an array (length: ${data3.performanceOverview.length})`);

  // --------------------------------------------------------------------------
  // TEST 4: Authenticated request for Teacher 2 (Data Ownership Verification)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 4: Data Ownership & Teacher Isolation (Teacher 2) ---');
  const res4 = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {
      Cookie: `teacher_auth_token=${token2}`,
    },
  });
  assert(res4.status === 200, `Expected HTTP 200 OK for Teacher 2, got HTTP ${res4.status}`);
  const data4 = await res4.json();
  assert(data4.teacher.id === teacher2.id, `Teacher 2 ID matches: ${data4.teacher.id}`);
  assert(data4.teacher.fullName === teacher2.fullName, `Teacher 2 Name matches: ${data4.teacher.fullName}`);

  if (teacher1.id !== teacher2.id) {
    assert(data4.teacher.id !== data3.teacher.id, 'Teacher 1 and Teacher 2 payloads are strictly isolated');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Authenticated access to /dashboard page HTML render
  // --------------------------------------------------------------------------
  console.log('\n--- Test 5: Authenticated Dashboard Page Access ---');
  const res5 = await fetch(`${BASE_URL}/dashboard`, {
    headers: {
      Cookie: `teacher_auth_token=${token1}`,
    },
    redirect: 'manual',
  });
  assert(res5.status === 200, `Expected HTTP 200 OK for authenticated /dashboard, got HTTP ${res5.status}`);

  console.log('\n============================================================');
  console.log(`ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('\n[TEST RUN ERROR]:', err);
  process.exit(1);
});
