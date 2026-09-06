import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ============================================================================
// SINGLETON LAZY DATABASE INITIALIZER
// ============================================================================
// What this file does:
// Manages a single, safe connection to the local SQLite database file ('data/capstone.db').
// Uses a singleton pattern to prevent database lock contention during multi-threaded
// Next.js build-time page collection workers.
//
// Why it is needed:
// Provides a centralized, thread-safe database helper that API routes can import
// to perform queries (Insert teacher, find teacher by email, etc.) synchronously.
// ============================================================================

let dbInstance: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Define database directory and file path.
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'capstone.db');
  
  // Create database connection instance.
  dbInstance = new Database(dbPath, { timeout: 10000 });

  // Enable WAL (Write-Ahead Logging) mode safely for better performance.
  try {
    dbInstance.pragma('journal_mode = WAL');
  } catch (err) {
    // Ignore if already WAL or locked in build worker
  }

  // Ensure tables exist.
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      teacherId TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
    );

    -- PARENT ACCOUNTS TABLE (MODULE 3)
    -- Stores parent registration requests, contact info, linked Grade 3 pupil,
    -- account status ('Pending', 'Approved', 'Rejected'), and teacher ownership.
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

    -- CLASSROOMS TABLE (MODULE 4: CLASSROOM MANAGEMENT)
    -- Stores teacher-managed classroom sections for Grade 3 pupils.
    -- Each classroom belongs to a specific teacher and has a status ('Active' or 'Archived').
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

    -- STUDENTS TABLE (MODULE 5: STUDENT MANAGEMENT)
    -- Stores Grade 3 pupil profiles managed by teachers.
    -- Each student is assigned to a classroom, owned by an authorized teacher,
    -- and can be optionally associated with an approved parent account.
    -- Uses soft-deactivation (status = 'Inactive') to preserve assessment history.
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

  return dbInstance;
}

// Export proxy object forwarding method calls to lazy database singleton.
const db = new Proxy({} as Database.Database, {
  get(_target, prop: keyof Database.Database) {
    const instance = getDatabase();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export default db;
