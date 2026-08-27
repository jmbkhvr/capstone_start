import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { hashPassword, createAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { validateRegistrationInput } from '@/lib/validation';

// ============================================================================
// TEACHER REGISTRATION API ENDPOINT
// ============================================================================
// What this endpoint does:
// Handles POST requests from the Teacher Registration page (/register).
// It validates input, checks for existing accounts, securely hashes the password,
// saves the new teacher record to the database, and creates a logged-in session.
//
// Why it is needed:
// Allows new teachers to create an account in the reading assessment system.
//
// Security Behavior:
// - Validates all inputs on the server side (never trusts client data alone).
// - Rejects registration if email or Teacher ID is already registered.
// - Hashes passwords with bcryptjs before saving to database (never plain text).
// - Sets an HTTP-Only secure session cookie upon successful registration.
// ============================================================================

export async function POST(request: Request) {
  try {
    // Parse incoming JSON body from registration request.
    const body = await request.json();
    const { fullName, teacherId, email, password, confirmPassword } = body;

    // Validate registration fields.
    const validation = validateRegistrationInput({
      fullName,
      teacherId,
      email,
      password,
      confirmPassword,
    });

    if (!validation.isValid) {
      // Return 400 Bad Request with user-friendly error message if validation fails.
      return NextResponse.json(
        { success: false, message: validation.errorMessage },
        { status: 400 }
      );
    }

    // Clean input strings.
    const cleanFullName = fullName.trim();
    const cleanTeacherId = teacherId.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if Teacher ID is already registered in database.
    const existingTeacherId = db
      .prepare('SELECT id FROM teachers WHERE teacherId = ?')
      .get(cleanTeacherId);

    if (existingTeacherId) {
      return NextResponse.json(
        {
          success: false,
          message: `Teacher ID "${cleanTeacherId}" is already registered. Please check your ID or login.`,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Check if Email address is already registered in database.
    const existingEmail = db
      .prepare('SELECT id FROM teachers WHERE email = ?')
      .get(cleanEmail);

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: `An account with email "${cleanEmail}" already exists. Please login instead.`,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Hash plain-text password using bcryptjs salt rounds.
    const passwordHash = await hashPassword(password);

    // Generate unique UUID string primary key.
    const newId = uuidv4();

    // Insert new teacher record into SQLite database.
    const insertStatement = db.prepare(`
      INSERT INTO teachers (id, teacherId, fullName, email, passwordHash)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertStatement.run(newId, cleanTeacherId, cleanFullName, cleanEmail, passwordHash);

    // Create session payload for JWT token.
    const teacherPayload = {
      id: newId,
      teacherId: cleanTeacherId,
      fullName: cleanFullName,
      email: cleanEmail,
    };

    // Sign JWT auth token.
    const token = createAuthToken(teacherPayload);

    // Prepare JSON response object.
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! Redirecting to your dashboard...',
      teacher: teacherPayload,
    });

    // Set HTTP-Only session cookie on the response header.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true, // Prevents client JavaScript XSS theft of session token
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // Session valid for 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    // Log unexpected internal server error safely (do not leak stack trace to user).
    console.error('Registration server error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}
