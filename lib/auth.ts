import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// ============================================================================
// SECURITY & AUTHENTICATION UTILITIES
// ============================================================================
// What this file does:
// Contains utility functions for hashing passwords, checking credentials,
// creating JSON Web Tokens (JWT), verifying JWTs, and managing auth cookies.
//
// Security Note:
// Plain-text passwords are NEVER stored or compared directly.
// Passwords are hashed using bcrypt with 10 rounds of salting.
// JWT tokens are signed using a secret key and stored in HTTP-Only cookies.
// ============================================================================

// Secret key used to sign and verify session JWTs.
// In production, this is loaded from environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'capstone_teacher_auth_secret_key_2026_safe';

// Name of the cookie storing the teacher's session token.
export const AUTH_COOKIE_NAME = 'teacher_auth_token';

// Interface defining the data stored inside the JWT token payload.
export interface TeacherJwtPayload {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

// ============================================================================
// PASSWORD HASHING FUNCTION
// ============================================================================
// This function takes a plain-text password from the registration form
// and hashes it using bcrypt before saving to the database.
export async function hashPassword(plainPassword: string): Promise<string> {
  // Generate a salt with 10 rounds and hash the password.
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

// ============================================================================
// PASSWORD VERIFICATION FUNCTION
// ============================================================================
// This function compares a plain-text password entered during login
// against the bcrypt password hash stored in the database.
export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  // Compare the plain text password against the hashed password.
  return bcrypt.compare(plainPassword, passwordHash);
}

// ============================================================================
// JWT TOKEN GENERATION
// ============================================================================
// This function creates a signed JWT session token containing non-sensitive
// teacher information (id, teacherId, fullName, email) that expires in 24 hours.
export function createAuthToken(payload: TeacherJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// ============================================================================
// JWT TOKEN VERIFICATION
// ============================================================================
// This function verifies a JWT token's signature and expiration.
// Returns the decoded teacher payload if valid, or null if invalid/expired.
export function verifyAuthToken(token: string): TeacherJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TeacherJwtPayload;
    return decoded;
  } catch (error) {
    // Return null if token is expired, tampered with, or invalid.
    return null;
  }
}

// ============================================================================
// CURRENT AUTHENTICATED TEACHER HELPER (SERVER SIDE)
// ============================================================================
// This function reads the session cookie from the incoming server request
// and returns the authenticated teacher payload if a valid session exists.
export async function getAuthenticatedTeacher(): Promise<TeacherJwtPayload | null> {
  // Access server cookie store.
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!tokenCookie || !tokenCookie.value) {
    return null; // User is not logged in.
  }

  // Verify and return decoded session payload.
  return verifyAuthToken(tokenCookie.value);
}
