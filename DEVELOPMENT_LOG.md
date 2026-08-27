# Teacher Side Development Log

## Update 1 - 9:30 PM August 27, 2026

### Update Information

* **Update Number**: Update 1
* **Exact Time**: 9:30 PM
* **Exact Date**: August 27, 2026
* **What Was Worked On**: 
  Initial project setup, database configuration, security architecture, and complete implementation of **Module 1: Teacher Authentication Module** (Teacher Registration, Login, Session Management, Logout, Route Protection Middleware, and Protected Dashboard UI).
* **Why It Was Done**: 
  To create a secure foundation allowing Grade 3 school teachers to register, authenticate, stay logged in securely via HTTP-Only session cookies, access protected pages, and terminate sessions safely.

---

### Files Created

1. **`prisma/schema.prisma`**: Database schema defining the `Teacher` account data structure for SQLite.
2. **`lib/db.ts`**: Centralized SQLite database helper using `better-sqlite3` with a thread-safe lazy singleton pattern.
3. **`lib/auth.ts`**: Security utilities for bcrypt password hashing (10 salt rounds), JWT token signing, token verification, and session reading.
4. **`lib/validation.ts`**: Server-side and client-side input validation helper for teacher registration and login forms.
5. **`middleware.ts`**: Server-side route protection middleware that automatically redirects unauthenticated visitors trying to access `/dashboard` (or future protected pages) to `/login`, and redirects logged-in teachers away from `/login` or `/register` to `/dashboard`.
6. **`app/api/auth/register/route.ts`**: Backend POST endpoint for creating new teacher accounts securely.
7. **`app/api/auth/login/route.ts`**: Backend POST endpoint for authenticating teacher email and password against bcrypt hashes.
8. **`app/api/auth/logout/route.ts`**: Backend POST endpoint for invalidating session cookies and logging out teachers.
9. **`app/api/auth/me/route.ts`**: Backend GET endpoint for verifying current authenticated teacher profile state.
10. **`app/login/page.tsx`**: Interactive Teacher Login page UI with form validation, error banners, and Suspense boundary.
11. **`app/register/page.tsx`**: Interactive Teacher Registration page UI for capturing name, teacher ID, email, and password.
12. **`app/dashboard/page.tsx`**: Protected Teacher Dashboard UI displaying teacher account credentials, active Module 1 status, and Logout button.
13. **`app/page.tsx`**: Root landing page automatically redirecting visitors based on authentication state.
14. **`DEVELOPMENT_LOG.md`**: Project update documentation log.

---

### Files Modified

1. **`app/layout.tsx`**: Updated system title, metadata description, and Inter typography styling.
2. **`app/globals.css`**: Added animation keyframes (`fadeIn`) for smooth UI error and success message banners.
3. **`package.json`**: Added project dependencies (`better-sqlite3`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `lucide-react`, `uuid`).

---

### Files Deleted

* None.

---

### Important Code Changes

* **Password Security**: Implemented bcrypt password hashing in `lib/auth.ts` and `app/api/auth/register/route.ts`. Passwords are NEVER saved in plain text.
* **Database Connection**: Configured a SQLite database (`data/capstone.db`) in `lib/db.ts` utilizing a lazy singleton wrapper to prevent multi-threaded lock issues during Next.js builds.
* **Session Cookies**: Created signed JSON Web Tokens (JWT) containing teacher UUID, Teacher ID, full name, and email, stored in HTTP-Only cookies to protect against client-side XSS script attacks.
* **Route Protection**: Configured `middleware.ts` to check `teacher_auth_token` cookie on protected route paths (`/dashboard`, `/parents`, `/classrooms`, `/students`, `/reading-materials`, `/assessments`).

---

### Database Changes

Created the **`teachers`** database table in SQLite (`data/capstone.db`) with the following column structure:

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | Primary Key | Unique internal UUID for the teacher record |
| `teacherId` | TEXT | Unique, Not Null | Official school Teacher Identification Number |
| `fullName` | TEXT | Not Null | Full legal name of the teacher |
| `email` | TEXT | Unique, Not Null | Email address used for login |
| `passwordHash` | TEXT | Not Null | Cryptographically hashed password via bcryptjs |
| `createdAt` | TEXT | Default `now()` | Account creation timestamp |
| `updatedAt` | TEXT | Default `now()` | Timestamp of last account update |

---

### Dependencies Installed

* `better-sqlite3` & `@types/better-sqlite3`: High-performance SQLite database driver for Node.js.
* `bcryptjs` & `@types/bcryptjs`: Hashing library for securing user passwords.
* `jsonwebtoken` & `@types/jsonwebtoken`: JWT library for signing and verifying user session tokens.
* `uuid` & `@types/uuid`: Universally Unique Identifier generator for primary key creation.
* `lucide-react`: Modern icon library for UI elements.
* `prisma` & `@prisma/client`: Database ORM and schema tools.

---

### Problems & Errors Encountered and How They Were Solved

1. **Problem / Error**: Missing Lucide icon export (`BadgeId`) caused Next.js build compilation failure.
   * **Cause**: `lucide-react` does not export an icon named `BadgeId`.
   * **Solution**: Replaced `BadgeId` with `IdCard` across `app/register/page.tsx` and `app/dashboard/page.tsx`.
   * **Result**: Clean icon rendering and successful TypeScript check.

2. **Problem / Error**: SQLite database lock (`SqliteError: database is locked`) during Next.js multi-worker build static analysis.
   * **Cause**: Next.js static page generation spawns 12 worker threads that concurrently executed module-level database initialization.
   * **Solution**: Refactored `lib/db.ts` to use a lazy singleton Proxy pattern that delays database file opening until queries are actually made.
   * **Result**: Next.js build completed smoothly with zero database lock conflicts.

3. **Problem / Error**: Next.js build warning regarding `useSearchParams()` requiring a Suspense boundary.
   * **Cause**: Next.js 15/16 requires Client Components reading URL query parameters (`searchParams.get('redirect')`) during static build to be wrapped in `<Suspense>`.
   * **Solution**: Separated form logic into `LoginFormContent` and wrapped it inside `<Suspense>` in `app/login/page.tsx`.
   * **Result**: Build passed cleanly without pre-rendering warnings.

---

### Testing Performed

Executed automated integration test suite (`scratch/test_auth.mjs`) covering all required authentication scenarios:

1. **Teacher Registration**: Successfully registered teacher "Maria Santos" (ID: `T-2026-001`, Email: `maria.santos@school.edu.ph`).
2. **Duplicate Registration Check**: Attempted duplicate registration with the same teacher ID; backend correctly rejected request with HTTP status `409 Conflict`.
3. **Invalid Password Login**: Attempted login with an incorrect password; backend safely rejected request with HTTP status `401 Unauthorized`.
4. **Valid Credentials Login**: Authenticated teacher successfully with valid email and password; received HTTP status `200 OK` and session cookie.
5. **Session Verification (`/api/auth/me`)**: Confirmed authenticated session returned decoded teacher profile payload.
6. **Logout Verification (`/api/auth/logout`)**: Verified cookie invalidation and session termination upon logout.

---

### Current Status

* **Module 1 (Authentication Module)**: **100% Complete and Operational**.
* Application builds cleanly (`npm run build`) and runs locally (`npm run dev`) at `http://localhost:3000`.

---

### What Remains Unfinished

* Module 1 core authentication (Registration, Login, Session Management, Logout) is completely finished.
* Password recovery (Forgot Password & Password Reset) is being added in Update 2 below.

---

## Update 2 - 9:42 PM August 27, 2026

### Update Information

* **Update Number**: Update 2
* **Exact Time**: 9:42 PM
* **Exact Date**: August 27, 2026
* **What Was Worked On**: 
  Implementation of **Forgot Password** and **Password Reset** functionality for the Teacher Authentication Module. Added password reset database schema (`password_resets`), reset token generation/verification helpers, email dispatcher service, 3 new backend API endpoints, `/forgot-password` UI page, `/reset-password` UI page, and "Forgot Password?" navigation link on `/login`.
* **Why It Was Added**: 
  To allow teachers who forget their account password to request a secure reset link via email, set a new password, and regain access to the Teacher Portal safely.

---

### Files Created

1. **`lib/email.ts`**: Email dispatcher helper that formats HTML password reset emails, supports configurable SMTP delivery via environment variables, and logs reset links to console for local development/testing.
2. **`app/api/auth/forgot-password/route.ts`**: Backend POST API endpoint for receiving email reset requests, generating 64-character secure random tokens with 1-hour expiration times, saving reset records to SQLite, and sending reset links.
3. **`app/api/auth/verify-reset-token/route.ts`**: Backend GET API endpoint for validating reset token presence, usage status, and expiration before rendering the reset form.
4. **`app/api/auth/reset-password/route.ts`**: Backend POST API endpoint for resetting passwords, hashing new passwords with bcryptjs, updating teacher records in the database, and marking reset tokens as used.
5. **`app/forgot-password/page.tsx`**: Interactive Forgot Password UI page allowing teachers to enter their registered email address.
6. **`app/reset-password/page.tsx`**: Interactive Reset Password UI page with token verification, new password inputs, password confirmation matching, and expired token warning handling.

---

### Files Modified

1. **`lib/db.ts`**: Updated database initializer to create the `password_resets` table in SQLite (`data/capstone.db`).
2. **`prisma/schema.prisma`**: Added the `PasswordReset` model and relation to the `Teacher` model.
3. **`lib/validation.ts`**: Added `validateForgotPasswordInput` and `validateResetPasswordInput` helper functions.
4. **`app/login/page.tsx`**: Added "Forgot Password?" link next to the password input label.
5. **`DEVELOPMENT_LOG.md`**: Appended Update 2 development documentation log.

---

### Files Deleted

* None.

---

### Important Code Changes

* **Secure Random Reset Tokens**: Reset tokens are 64-character hex strings generated using `crypto.randomBytes(32).toString('hex')`. Tokens expire 1 hour (`60 * 60 * 1000` ms) after creation.
* **Token Single-Use Consumption**: Once a password reset is performed, `used` is updated to `1` in `password_resets`. Subsequent attempts with the same token are rejected with HTTP `400 Bad Request`.
* **Account Enumeration Protection**: The `/api/auth/forgot-password` endpoint returns the exact same generic success message regardless of whether the requested email exists in the database.
* **Bcrypt Password Updating**: When resetting a password, the new password is hashed with bcryptjs (10 salt rounds) before updating `passwordHash` in the `teachers` table.

---

### Database Changes

Created the **`password_resets`** table in SQLite (`data/capstone.db`) with foreign key reference to `teachers(id)`:

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | Primary Key | Unique UUID string for the reset request |
| `teacherId` | TEXT | Foreign Key (teachers.id) | Teacher account ID associated with the reset request |
| `email` | TEXT | Not Null | Teacher email address |
| `token` | TEXT | Unique, Not Null | Secure 64-character random reset token string |
| `expiresAt` | TEXT | Not Null | Expiration timestamp ISO string (1 hour from creation) |
| `used` | INTEGER | Default `0` | Usage status: `0` = unused/active, `1` = consumed/used |
| `createdAt` | TEXT | Default `now()` | Reset request creation timestamp |

---

### Dependencies Installed

* `nodemailer` & `@types/nodemailer`: Installed for SMTP email dispatching.

---

### Email Configuration

* **Environment Variables**:
  - `SMTP_HOST`: Hostname of SMTP server (e.g. `smtp.gmail.com` or custom mail server).
  - `SMTP_PORT`: SMTP port (default `587`, or `465` for SSL).
  - `SMTP_USER`: SMTP authentication username/email.
  - `SMTP_PASS`: SMTP authentication password/app secret.
  - `SMTP_FROM`: Sender display name and email address.
* **Local Development Behavior**: If SMTP environment variables are not configured, `lib/email.ts` safely logs the generated reset link (`http://localhost:3000/reset-password?token=...`) directly to the server terminal output, enabling instant zero-config testing.

---

### Backend Changes

* Added `/api/auth/forgot-password` route handler with email enumeration protection.
* Added `/api/auth/verify-reset-token` route handler for token pre-validation.
* Added `/api/auth/reset-password` route handler for password updates & token invalidation.

---

### Frontend Changes

* Added "Forgot Password?" link on `/login`.
* Built `/forgot-password` page with email form and "Back to Login" navigation.
* Built `/reset-password` page with token verification on mount, expired link warning UI, and new password confirmation form.

---

### Security Implementation

1. **Token Unpredictability**: 64-character crypto-random string.
2. **Expiration Enforcement**: 1-hour expiration window.
3. **Single-Use Enforcement**: Tokens marked `used = 1` immediately after successful reset.
4. **No Plain-Text Passwords**: Passwords are never sent via email or included in URLs. Only secure single-use tokens are sent.
5. **Bcrypt Hashing**: New passwords are cryptographically hashed using bcryptjs.

---

### Problems & Errors Encountered and How They Were Solved

1. **Problem / Error**: Syntax error `SyntaxError: Unexpected identifier 'as'` when executing test script `scratch/test_password_reset.mjs`.
   * **Cause**: TypeScript type assertion syntax (`as { token: string }`) was included in a vanilla `.mjs` JavaScript test file.
   * **Solution**: Removed TypeScript syntax assertions from `.mjs` test file.
   * **Result**: Test script executed cleanly.

2. **Problem / Error**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'better-sqlite3'` when running test script from inside nested `brain/.../scratch/` directory.
   * **Cause**: Node.js ESM loader resolves `node_modules` relative to the script file path.
   * **Solution**: Placed test script `test_password_reset.mjs` in project root directory (`c:\capstone_start\test_password_reset.mjs`).
   * **Result**: Dependencies resolved correctly and test suite executed with 100% pass rate.

---

### Testing Performed & Results

Executed automated test suite (`test_password_reset.mjs`) covering all 8 password reset workflow steps:

1. **Step 1 (Setup)**: Registered test teacher account `reset.teacher@school.edu.ph` with password `OldPassword123!`.
2. **Step 2 (Forgot Password Request)**: Submitted Forgot Password request; received HTTP `200 OK`.
3. **Step 3 (Account Enumeration Protection)**: Submitted Forgot Password request for `nonexistent.user@school.edu.ph`; received identical HTTP `200 OK` response.
4. **Step 4 (Database Verification)**: Inspected `password_resets` table; verified 64-character token created with `used = 0`.
5. **Step 5 (Token Verification)**: Verified `/api/auth/verify-reset-token`; invalid token returned `valid: false`, active token returned `valid: true`.
6. **Step 6 (Password Reset)**: Reset password to `NewPassword999!` using valid token; received HTTP `200 OK`.
7. **Step 7 (Token Reuse Protection)**: Attempted to reuse same token; backend correctly rejected request with HTTP `400 Bad Request` ("This password reset link has already been used.").
8. **Step 8 (Login Verification)**:
   - Login with OLD password (`OldPassword123!`) -> Rejected with HTTP `401 Unauthorized`.
   - Login with NEW password (`NewPassword999!`) -> Authenticated with HTTP `200 OK`.

---

### Current Status

* **Module 1 (Authentication Module - Plan A)**: **100% Complete & Operational**.
* Includes Registration, Login, Logout, Session Cookie Management, Route Protection Middleware, Forgot Password, and Password Reset.
* Application builds cleanly (`npm run build`) and runs locally (`npm run dev`) at `http://localhost:3000`.

---

### Remaining Issues / Unfinished Work

* None for Module 1. The complete Teacher Authentication Module is finished.
* Future teacher modules (Classrooms, Students, Reading Materials, Assessments, Pronunciation Scoring, Reports) will be developed in future modules as instructed.

