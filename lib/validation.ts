// ============================================================================
// INPUT VALIDATION UTILITIES
// ============================================================================
// What this file does:
// Provides input validation functions for Teacher Registration and Login data.
//
// Why it is needed:
// Prevents invalid, malformed, or incomplete data from reaching the backend
// database and provides clear, user-friendly error messages when input fails.
// Security Note:
// Validation is performed on both the backend server and frontend client
// so that client-side bypasses cannot compromise system integrity.
// ============================================================================

// Interface representing teacher registration input fields.
export interface RegisterInput {
  fullName?: string;
  teacherId?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Interface representing teacher login input fields.
export interface LoginInput {
  email?: string;
  password?: string;
}

// Interface for validation result output.
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

// Regular expression to test standard email format (e.g. teacher@school.edu.ph).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// TEACHER REGISTRATION VALIDATION
// ============================================================================
// Validates all required teacher registration fields and checks business rules:
// 1. All fields must be filled out.
// 2. Email must be in a valid format.
// 3. Password must be at least 8 characters long.
// 4. Password and Confirm Password must match.
export function validateRegistrationInput(input: RegisterInput): ValidationResult {
  const { fullName, teacherId, email, password, confirmPassword } = input;

  // Check required full name.
  if (!fullName || fullName.trim().length === 0) {
    return { isValid: false, errorMessage: 'Full name is required.' };
  }
  if (fullName.trim().length < 2) {
    return { isValid: false, errorMessage: 'Full name must be at least 2 characters long.' };
  }

  // Check required teacher identification number.
  if (!teacherId || teacherId.trim().length === 0) {
    return { isValid: false, errorMessage: 'Teacher ID is required.' };
  }

  // Check required email and format.
  if (!email || email.trim().length === 0) {
    return { isValid: false, errorMessage: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, errorMessage: 'Please enter a valid email address (e.g. teacher@school.edu).' };
  }

  // Check required password and length.
  if (!password || password.length === 0) {
    return { isValid: false, errorMessage: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, errorMessage: 'Password must be at least 8 characters long.' };
  }

  // Check password confirmation match.
  if (!confirmPassword || confirmPassword.length === 0) {
    return { isValid: false, errorMessage: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, errorMessage: 'Password and Password Confirmation do not match.' };
  }

  // If all checks pass, return valid.
  return { isValid: true };
}

// ============================================================================
// TEACHER LOGIN VALIDATION
// ============================================================================
// Validates teacher login credentials input:
// 1. Email must be provided and validly formatted.
// 2. Password must be provided.
export function validateLoginInput(input: LoginInput): ValidationResult {
  const { email, password } = input;

  // Check missing email.
  if (!email || email.trim().length === 0) {
    return { isValid: false, errorMessage: 'Please enter your email address.' };
  }

  // Check valid email format.
  if (!EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, errorMessage: 'Please enter a valid email address.' };
  }

  // Check missing password.
  if (!password || password.trim().length === 0) {
    return { isValid: false, errorMessage: 'Please enter your password.' };
  }

  return { isValid: true };
}

// ============================================================================
// FORGOT PASSWORD VALIDATION
// ============================================================================
// Validates the email address entered by a teacher requesting a password reset.
export function validateForgotPasswordInput(email?: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, errorMessage: 'Please enter your registered email address.' };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, errorMessage: 'Please enter a valid email address (e.g. teacher@school.edu.ph).' };
  }

  return { isValid: true };
}

// ============================================================================
// RESET PASSWORD VALIDATION
// ============================================================================
// Validates the new password inputs submitted on the password reset page:
// 1. Password reset token must be present.
// 2. New password must be at least 8 characters.
// 3. Confirm Password must match New Password exactly.
export function validateResetPasswordInput(input: {
  token?: string;
  password?: string;
  confirmPassword?: string;
}): ValidationResult {
  const { token, password, confirmPassword } = input;

  if (!token || token.trim().length === 0) {
    return { isValid: false, errorMessage: 'Invalid or missing password reset token.' };
  }

  if (!password || password.length === 0) {
    return { isValid: false, errorMessage: 'Please enter your new password.' };
  }

  if (password.length < 8) {
    return { isValid: false, errorMessage: 'New password must be at least 8 characters long.' };
  }

  if (!confirmPassword || confirmPassword.length === 0) {
    return { isValid: false, errorMessage: 'Please confirm your new password.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, errorMessage: 'New password and Confirm Password do not match.' };
  }

  return { isValid: true };
}
