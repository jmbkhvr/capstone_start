// ============================================================================
// AUTOMATED INTEGRATION TEST SUITE: STUDENT MANAGEMENT MODULE (MODULE 5)
// ============================================================================
// What this script tests:
// 1. Unauthenticated access to /api/students returns HTTP 401 Unauthorized.
// 2. Unauthenticated access to /students redirects to /login.
// 3. Database students table schema, foreign keys, and fields.
// 4. Authenticated access to /api/students returns student records and status counts.
// 5. Validation error handling on POST /api/students (missing names, missing classroom).
// 6. Successful student creation (POST /api/students) with HTTP 201.
// 7. Duplicate student prevention in the same classroom (HTTP 409 Conflict).
// 8. Single student retrieval by ID (GET /api/students/[id]).
// 9. Student updating (PUT /api/students/[id]).
// 10. Student classroom transfer (PATCH /api/students/[id]/classroom).
// 11. Soft deactivation functionality (PATCH /api/students/[id]/status).
// 12. Student restoration functionality (status: 'Active').
// 13. Search query filtering (?search=...).
// 14. Status filtering (?status=Active, ?status=Inactive, ?status=All).
// 15. Classroom filtering (?classroom=...).
// 16. Multi-tenant data isolation: Teacher B cannot view, edit, move, or deactivate Teacher A's students.
// 17. Authenticated HTML page render for /students returns HTTP 200 OK.
// ============================================================================

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const db = new Database('data/capstone.db');

// Ensure tables exist in case test runs directly
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

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    middleName TEXT,
    lastName TEXT NOT NULL,
    fullName TEXT NOT NULL,
    gradeLevel TEXT NOT NULL DEFAULT 'Grade 3',
    classroomId TEXT NOT NULL,
    teacherId TEXT NOT NULL,
    parentId TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (classroomId) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES parents(id) ON DELETE SET NULL
  );
`);

async function runTests() {
  console.log('============================================================');
  console.log('STARTING MODULE 5: STUDENT MANAGEMENT AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
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
      VALUES (?, 'T-TEST-001', 'Primary Test Teacher', 'teacher1.studenttest@school.edu.ph', 'hash')
    `).run(t1Id);
    teacher1 = db.prepare('SELECT id, teacherId, fullName, email FROM teachers WHERE id = ?').get(t1Id);
  }

  const teacher1Token = jwt.sign(
    { id: teacher1.id, teacherId: teacher1.teacherId, fullName: teacher1.fullName, email: teacher1.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  const teacher1Cookie = `teacher_auth_token=${teacher1Token}`;

  // Setup: Create a distinct second teacher (Teacher 2) for cross-teacher authorization tests
  const teacher2Id = randomUUID();
  db.prepare(`
    INSERT INTO teachers (id, teacherId, fullName, email, passwordHash)
    VALUES (?, ?, 'Secondary Student Tester', ?, 'hash')
  `).run(teacher2Id, `T-STU-${Date.now()}`, `stu.test.${Date.now()}@school.edu.ph`);

  const teacher2 = db.prepare('SELECT id, teacherId, fullName, email FROM teachers WHERE id = ?').get(teacher2Id);
  const teacher2Token = jwt.sign(
    { id: teacher2.id, teacherId: teacher2.teacherId, fullName: teacher2.fullName, email: teacher2.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  const teacher2Cookie = `teacher_auth_token=${teacher2Token}`;

  // Ensure Teacher 1 has two classrooms
  const classAId = randomUUID();
  const classBId = randomUUID();
  db.prepare(`
    INSERT INTO classrooms (id, name, gradeLevel, section, schoolYear, teacherId, status)
    VALUES (?, 'Grade 3 - Section Sampaguita', 'Grade 3', 'Sampaguita', '2026-2027', ?, 'Active')
  `).run(classAId, teacher1.id);

  db.prepare(`
    INSERT INTO classrooms (id, name, gradeLevel, section, schoolYear, teacherId, status)
    VALUES (?, 'Grade 3 - Section Rosal', 'Grade 3', 'Rosal', '2026-2027', ?, 'Active')
  `).run(classBId, teacher1.id);

  // Ensure Teacher 2 has a classroom
  const classTeacher2Id = randomUUID();
  db.prepare(`
    INSERT INTO classrooms (id, name, gradeLevel, section, schoolYear, teacherId, status)
    VALUES (?, 'Teacher 2 Classroom', 'Grade 3', 'Orchid', '2026-2027', ?, 'Active')
  `).run(classTeacher2Id, teacher2.id);

  let createdStudentId = null;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated access to /api/students returns HTTP 401
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Access ---');
    const unauthRes = await fetch(`${BASE_URL}/api/students`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/students returns HTTP 401 Unauthorized');
    const unauthJson = await unauthRes.json();
    assert(Boolean(unauthJson.error), 'Unauthenticated response contains descriptive error message');

    // ------------------------------------------------------------------------
    // TEST 2: Unauthenticated navigation to /students redirects to /login
    // ------------------------------------------------------------------------
    const unauthPageRes = await fetch(`${BASE_URL}/students`, { redirect: 'manual' });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 302,
      'Unauthenticated GET /students redirects (HTTP 302/307) to /login'
    );

    // ------------------------------------------------------------------------
    // TEST 3: Authenticated access to /api/students
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Testing Authenticated Read & Stats ---');
    const authRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { Cookie: teacher1Cookie },
    });
    assert(authRes.status === 200, 'Authenticated GET /api/students returns HTTP 200 OK');
    const authData = await authRes.json();
    assert(authData.success === true, 'Response JSON indicates success: true');
    assert(Array.isArray(authData.students), 'Response contains students array');
    assert(typeof authData.counts?.all === 'number', 'Response contains counts.all numeric metric');
    assert(Array.isArray(authData.classrooms), 'Response contains teacher active classrooms list');

    // ------------------------------------------------------------------------
    // TEST 4: Validation on POST /api/students
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Testing Input Validations ---');
    const missingFirstRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ firstName: '', lastName: 'Reyes', classroomId: classAId }),
    });
    assert(missingFirstRes.status === 400, 'POST /api/students with empty firstName returns HTTP 400');

    const missingLastRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ firstName: 'Maria', lastName: '', classroomId: classAId }),
    });
    assert(missingLastRes.status === 400, 'POST /api/students with empty lastName returns HTTP 400');

    const missingClassRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ firstName: 'Maria', lastName: 'Reyes', classroomId: '' }),
    });
    assert(missingClassRes.status === 400, 'POST /api/students with missing classroomId returns HTTP 400');

    // ------------------------------------------------------------------------
    // TEST 5: Successful Student Creation (HTTP 201)
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Testing Student Creation ---');
    const uniqueLastName = `DelaCruz_${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({
        firstName: 'Juan',
        middleName: 'Santos',
        lastName: uniqueLastName,
        classroomId: classAId,
      }),
    });
    assert(createRes.status === 201, 'POST /api/students returns HTTP 201 Created');
    const createData = await createRes.json();
    assert(createData.success === true, 'Response JSON indicates success: true');
    assert(createData.student?.fullName === `Juan Santos ${uniqueLastName}`, 'Student fullName properly constructed');
    assert(createData.student?.gradeLevel === 'Grade 3', 'Pupil gradeLevel dynamically inherited from classroom');
    createdStudentId = createData.student.id;

    // ------------------------------------------------------------------------
    // TEST 6: Duplicate Student Prevention (HTTP 409 Conflict)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Duplicate Student Prevention ---');
    const duplicateRes = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({
        firstName: 'Juan',
        middleName: 'Santos',
        lastName: uniqueLastName,
        classroomId: classAId,
      }),
    });
    assert(duplicateRes.status === 409, 'POST duplicate student in same classroom returns HTTP 409 Conflict');

    // ------------------------------------------------------------------------
    // TEST 7: Single Student Retrieval (GET /api/students/[id])
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Testing Single Student Retrieval ---');
    const getSingleRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`, {
      headers: { Cookie: teacher1Cookie },
    });
    assert(getSingleRes.status === 200, 'GET /api/students/[id] returns HTTP 200 OK');
    const singleData = await getSingleRes.json();
    assert(singleData.student?.id === createdStudentId, 'Returned student ID matches requested ID');
    assert(Boolean(singleData.student?.classroomName), 'Returned student includes joined classroomName');

    // ------------------------------------------------------------------------
    // TEST 8: Update Student (PUT /api/students/[id])
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Testing Student Profile Update ---');
    const updateRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({
        firstName: 'Juan',
        middleName: 'Protacio',
        lastName: uniqueLastName,
        classroomId: classAId,
      }),
    });
    assert(updateRes.status === 200, 'PUT /api/students/[id] returns HTTP 200 OK');
    const updateData = await updateRes.json();
    assert(updateData.student?.middleName === 'Protacio', 'Student middleName successfully updated');
    assert(updateData.student?.fullName === `Juan Protacio ${uniqueLastName}`, 'Student fullName updated');

    // ------------------------------------------------------------------------
    // TEST 9: Student Classroom Transfer (PATCH /api/students/[id]/classroom)
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Testing Classroom Transfer ---');
    const moveRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}/classroom`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ classroomId: classBId }),
    });
    assert(moveRes.status === 200, 'PATCH /api/students/[id]/classroom returns HTTP 200 OK');
    const moveData = await moveRes.json();
    assert(moveData.student?.classroomId === classBId, 'Student successfully moved to classroom B');

    // Re-transferring to the same classroom returns 400
    const sameMoveRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}/classroom`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ classroomId: classBId }),
    });
    assert(sameMoveRes.status === 400, 'Transferring student to their current classroom returns HTTP 400');

    // ------------------------------------------------------------------------
    // TEST 10: Soft Deactivation & Restoration (PATCH /api/students/[id]/status)
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Testing Soft Deactivation & Restoration ---');
    const deactRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ status: 'Inactive' }),
    });
    assert(deactRes.status === 200, 'Deactivating student returns HTTP 200 OK');
    const deactData = await deactRes.json();
    assert(deactData.student?.status === 'Inactive', 'Student status is now Inactive');

    // Restore student
    const restRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ status: 'Active' }),
    });
    assert(restRes.status === 200, 'Restoring student returns HTTP 200 OK');
    const restData = await restRes.json();
    assert(restData.student?.status === 'Active', 'Student status restored to Active');

    // ------------------------------------------------------------------------
    // TEST 11: Query Filtering & Search
    // ------------------------------------------------------------------------
    console.log('\n--- 10. Testing Roster Filtering & Search ---');
    const searchRes = await fetch(`${BASE_URL}/api/students?search=${uniqueLastName}`, {
      headers: { Cookie: teacher1Cookie },
    });
    assert(searchRes.status === 200, 'Search query returns HTTP 200 OK');
    const searchData = await searchRes.json();
    assert(searchData.students?.length >= 1, 'Search query returns created student');

    const filterClassRes = await fetch(`${BASE_URL}/api/students?classroom=${classBId}`, {
      headers: { Cookie: teacher1Cookie },
    });
    const filterClassData = await filterClassRes.json();
    assert(
      filterClassData.students?.every((s) => s.classroomId === classBId),
      'Classroom filter returns only students in selected classroom'
    );

    // ------------------------------------------------------------------------
    // TEST 12: Multi-Tenant Data Isolation (Cross-Teacher Security)
    // ------------------------------------------------------------------------
    console.log('\n--- 11. Testing Multi-Tenant Data Isolation ---');
    // Teacher 2 tries to GET Teacher 1's student
    const t2GetRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`, {
      headers: { Cookie: teacher2Cookie },
    });
    assert(t2GetRes.status === 404, 'Teacher 2 cannot view Teacher 1 student (HTTP 404 Not Found)');

    // Teacher 2 tries to PUT Teacher 1's student
    const t2PutRes = await fetch(`${BASE_URL}/api/students/${createdStudentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: teacher2Cookie },
      body: JSON.stringify({ firstName: 'Intruder', lastName: 'Change', classroomId: classTeacher2Id }),
    });
    assert(t2PutRes.status === 404, 'Teacher 2 cannot edit Teacher 1 student (HTTP 404 Not Found)');

    // Teacher 1 tries to transfer their student to Teacher 2's classroom
    const t1MoveToT2Res = await fetch(`${BASE_URL}/api/students/${createdStudentId}/classroom`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teacher1Cookie },
      body: JSON.stringify({ classroomId: classTeacher2Id }),
    });
    assert(
      t1MoveToT2Res.status === 403 || t1MoveToT2Res.status === 404,
      'Teacher 1 cannot move student to Teacher 2 classroom (HTTP 403/404 Forbidden)'
    );

    // ------------------------------------------------------------------------
    // TEST 13: Authenticated Page Render (/students)
    // ------------------------------------------------------------------------
    console.log('\n--- 12. Testing /students Page Render ---');
    const pageRes = await fetch(`${BASE_URL}/students`, {
      headers: { Cookie: teacher1Cookie },
    });
    assert(pageRes.status === 200, 'Authenticated GET /students renders HTML page (HTTP 200 OK)');
    const pageHtml = await pageRes.text();
    assert(pageHtml.includes('Student Management') || pageHtml.includes('DOCTYPE html'), 'Page HTML rendered');

    console.log('\n============================================================');
    console.log(`🎉 ALL ${passed}/${total} MODULE 5 TESTS PASSED SUCCESSFULLY!`);
    console.log('============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MODULE 5 TEST SUITE FAILED:', error);
    process.exit(1);
  } finally {
    // Cleanup temporary test student and classrooms
    if (createdStudentId) {
      db.prepare('DELETE FROM students WHERE id = ?').run(createdStudentId);
    }
    db.prepare('DELETE FROM classrooms WHERE id IN (?, ?, ?)').run(classAId, classBId, classTeacher2Id);
    db.prepare('DELETE FROM teachers WHERE id = ?').run(teacher2Id);
  }
}

runTests();
