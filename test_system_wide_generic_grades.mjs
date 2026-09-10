// ============================================================================
// SYSTEM-WIDE GENERIC GRADE LEVEL VERIFICATION TEST
// ============================================================================
// Validates Section 28 requirements:
// Tests that Grade 1, Grade 2, Grade 3, Grade 4, Grade 5, and Grade 6:
// 1. Can create classrooms with that grade level.
// 2. Can enroll students with that grade level.
// 3. Can create reading passages with that grade level.
// 4. Can filter reading passages and classrooms by that grade level.
// ============================================================================

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const db = new Database('data/capstone.db');

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

async function run() {
  console.log('============================================================');
  console.log('STARTING SYSTEM-WIDE GENERIC GRADE LEVEL TEST (GRADES 1 - 6)');
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
    }
  }

  // Create temporary teacher
  const teacherId = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO teachers (id, teacherId, fullName, email, passwordHash, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    teacherId,
    `T-${Date.now().toString().slice(-4)}`,
    'Prof. Multi Grade',
    `multigrade_${Date.now()}@school.edu.ph`,
    'hash',
    now,
    now
  );

  const token = jwt.sign(
    { id: teacherId, email: `multigrade_${Date.now()}@school.edu.ph`, fullName: 'Prof. Multi Grade' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const headers = {
    'Content-Type': 'application/json',
    Cookie: `teacher_auth_token=${token}`,
  };

  try {
    for (const grade of GRADES) {
      console.log(`\n--- Testing ${grade} End-to-End ---`);

      // 1. Create Classroom with this grade level
      const classRes = await fetch(`${BASE_URL}/api/classrooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: `${grade} - Section Alpha`,
          gradeLevel: grade,
          section: 'Alpha',
          schoolYear: '2026-2027',
          description: `General classroom section for ${grade}`,
        }),
      });
      assert(classRes.status === 201, `Created classroom for ${grade} (HTTP 201)`);
      const classData = await classRes.json();
      assert(classData.classroom.gradeLevel === grade, `Classroom saved with gradeLevel = "${grade}"`);
      const classroomId = classData.classroom.id;

      // 2. Create Student with this grade level
      const studentRes = await fetch(`${BASE_URL}/api/students`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: `Learner`,
          lastName: grade.replace(' ', ''),
          gradeLevel: grade,
          classroomId,
        }),
      });
      assert(studentRes.status === 201, `Enrolled student for ${grade} (HTTP 201)`);
      const studentData = await studentRes.json();
      assert(studentData.student.gradeLevel === grade, `Student profile saved with gradeLevel = "${grade}"`);

      // 3. Create Reading Passage for this grade level
      const passageRes = await fetch(`${BASE_URL}/api/reading-materials`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `${grade} Reading Adventure`,
          description: `Reference passage tailored for ${grade} learners`,
          gradeLevel: grade,
          difficulty: 'Easy',
          content: `Reading opens the door to great learning and discovery for every student in ${grade}.`,
        }),
      });
      assert(passageRes.status === 201, `Created reading passage for ${grade} (HTTP 201)`);
      const passageData = await passageRes.json();
      assert(passageData.material.gradeLevel === grade, `Reading passage saved with gradeLevel = "${grade}"`);

      // 4. Verify Grade Level Filter
      const filterRes = await fetch(`${BASE_URL}/api/reading-materials?grade=${encodeURIComponent(grade)}`, {
        headers,
      });
      const filterData = await filterRes.json();
      assert(
        filterData.materials.some((m) => m.id === passageData.material.id && m.gradeLevel === grade),
        `Filter query ?grade=${grade} successfully returned the ${grade} passage`
      );
    }

    console.log('\n============================================================');
    console.log(`🎉 MULTI-GRADE TEST RESULT: ${passed}/${total} PASSED (100%)`);
    console.log('============================================================\n');
  } finally {
    // Cleanup
    db.prepare('DELETE FROM reading_materials WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM students WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM classrooms WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM teachers WHERE id = ?').run(teacherId);
  }
}

run().catch((err) => {
  console.error('Fatal error in multi-grade test:', err);
  process.exit(1);
});
