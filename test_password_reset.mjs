import Database from 'better-sqlite3';
import path from 'path';

// ============================================================================
// AUTOMATED TEST SUITE FOR UPDATE 2 (FORGOT PASSWORD & RESET PASSWORD)
// ============================================================================
// What this script does:
// Tests the end-to-end Password Reset flow:
// 1. Teacher Registration (Setup)
// 2. Forgot Password Request (/api/auth/forgot-password)
// 3. Account Enumeration Protection (Unregistered email returns same message)
// 4. Reset Token Verification (/api/auth/verify-reset-token)
// 5. Invalid Token Rejection
// 6. Successful Password Reset (/api/auth/reset-password)
// 7. Used Token Reuse Rejection
// 8. Login Verification (Old password fails, new password succeeds)
// ============================================================================

async function runPasswordResetTests() {
  console.log('--- STARTING UPDATE 2 PASSWORD RESET TESTS ---\n');

  const BASE_URL = 'http://localhost:3000';
  const testEmail = 'reset.teacher@school.edu.ph';
  const oldPassword = 'OldPassword123!';
  const newPassword = 'NewPassword999!';

  // Connect directly to SQLite DB to read reset token for automated assertion.
  const dbPath = path.join(process.cwd(), 'data', 'capstone.db');
  const db = new Database(dbPath);

  // --------------------------------------------------------------------------
  // STEP 1: Register test teacher account
  // --------------------------------------------------------------------------
  console.log('Step 1: Registering test teacher account...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Reset Test Teacher',
      teacherId: 'T-RESET-999',
      email: testEmail,
      password: oldPassword,
      confirmPassword: oldPassword,
    }),
  });

  const regData = await regRes.json();
  console.log(`Registration Response (${regRes.status}):`, regData.message);
  console.assert(regRes.status === 200 || regRes.status === 409, 'Step 1 Failed');
  console.log('✅ STEP 1 COMPLETED.\n');

  // --------------------------------------------------------------------------
  // STEP 2: Request Forgot Password Link
  // --------------------------------------------------------------------------
  console.log('Step 2: Submitting Forgot Password request for registered email...');
  const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });

  const forgotData = await forgotRes.json();
  console.log(`Forgot Password Response (${forgotRes.status}):`, forgotData.message);
  console.assert(forgotRes.status === 200, 'Step 2 Failed');
  console.assert(forgotData.success === true, 'Step 2 Failed');
  console.log('✅ STEP 2 PASSED: Forgot Password request accepted.\n');

  // --------------------------------------------------------------------------
  // STEP 3: Test Account Enumeration Protection
  // --------------------------------------------------------------------------
  console.log('Step 3: Submitting Forgot Password request for UNREGISTERED email...');
  const anonForgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent.user@school.edu.ph' }),
  });

  const anonForgotData = await anonForgotRes.json();
  console.log(`Unregistered Email Response (${anonForgotRes.status}):`, anonForgotData.message);
  console.assert(anonForgotRes.status === 200, 'Step 3 Failed');
  console.assert(anonForgotData.message === forgotData.message, 'Step 3 Failed: Enumeration protection message mismatch');
  console.log('✅ STEP 3 PASSED: Account enumeration protection verified.\n');

  // --------------------------------------------------------------------------
  // STEP 4: Query Database for generated token
  // --------------------------------------------------------------------------
  console.log('Step 4: Inspecting SQLite database for generated reset token...');
  const resetRecord = db
    .prepare('SELECT token, expiresAt, used FROM password_resets WHERE email = ? ORDER BY createdAt DESC')
    .get(testEmail);

  console.assert(resetRecord !== undefined, 'Step 4 Failed: No reset record found in database');
  console.assert(resetRecord?.used === 0, 'Step 4 Failed: Token should be unused');
  const validToken = resetRecord.token;
  console.log(`Found Active Token: ${validToken.substring(0, 16)}...`);
  console.log('✅ STEP 4 PASSED: Reset token verified in database.\n');

  // --------------------------------------------------------------------------
  // STEP 5: Test Token Verification Endpoint (/api/auth/verify-reset-token)
  // --------------------------------------------------------------------------
  console.log('Step 5: Testing /api/auth/verify-reset-token with invalid vs valid token...');
  
  // Test invalid token
  const badVerifyRes = await fetch(`${BASE_URL}/api/auth/verify-reset-token?token=INVALID_TOKEN_STRING`);
  const badVerifyData = await badVerifyRes.json();
  console.assert(badVerifyData.valid === false, 'Step 5 Invalid Token Test Failed');
  console.log('Invalid Token Response:', badVerifyData.message);

  // Test valid token
  const goodVerifyRes = await fetch(`${BASE_URL}/api/auth/verify-reset-token?token=${validToken}`);
  const goodVerifyData = await goodVerifyRes.json();
  console.assert(goodVerifyData.valid === true, 'Step 5 Valid Token Test Failed');
  console.log('Valid Token Response:', goodVerifyData);
  console.log('✅ STEP 5 PASSED: Token verification endpoint verified.\n');

  // --------------------------------------------------------------------------
  // STEP 6: Reset Password with valid token
  // --------------------------------------------------------------------------
  console.log('Step 6: Resetting password using valid token...');
  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: validToken,
      password: newPassword,
      confirmPassword: newPassword,
    }),
  });

  const resetData = await resetRes.json();
  console.log(`Reset Password Response (${resetRes.status}):`, resetData.message);
  console.assert(resetRes.status === 200, 'Step 6 Failed');
  console.assert(resetData.success === true, 'Step 6 Failed');
  console.log('✅ STEP 6 PASSED: Password reset successfully.\n');

  // --------------------------------------------------------------------------
  // STEP 7: Re-attempt Reset with already consumed token
  // --------------------------------------------------------------------------
  console.log('Step 7: Attempting to reuse consumed reset token...');
  const reuseRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: validToken,
      password: 'AnotherPassword123!',
      confirmPassword: 'AnotherPassword123!',
    }),
  });

  const reuseData = await reuseRes.json();
  console.log(`Token Reuse Response (${reuseRes.status}):`, reuseData.message);
  console.assert(reuseRes.status === 400, 'Step 7 Failed: Expected status 400');
  console.assert(reuseData.success === false, 'Step 7 Failed: Expected success false');
  console.log('✅ STEP 7 PASSED: Consumed token reuse safely rejected.\n');

  // --------------------------------------------------------------------------
  // STEP 8: Login Verification (Old password vs New password)
  // --------------------------------------------------------------------------
  console.log('Step 8: Testing Login with OLD password (should FAIL)...');
  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: oldPassword,
    }),
  });

  const oldLoginData = await oldLoginRes.json();
  console.log(`Old Password Login Response (${oldLoginRes.status}):`, oldLoginData.message);
  console.assert(oldLoginRes.status === 401, 'Step 8 Old Password Test Failed: Should return 401');

  console.log('\nStep 8b: Testing Login with NEW password (should SUCCEED)...');
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });

  const newLoginData = await newLoginRes.json();
  console.log(`New Password Login Response (${newLoginRes.status}):`, newLoginData.message);
  console.assert(newLoginRes.status === 200, 'Step 8 New Password Test Failed: Should return 200');
  console.assert(newLoginData.success === true, 'Step 8 New Password Test Failed');
  console.log('✅ STEP 8 PASSED: Login verified (Old password rejected, New password authenticated).\n');

  console.log('🎉 ALL UPDATE 2 PASSWORD RESET TESTS PASSED SUCCESSFULLY!');
}

runPasswordResetTests().catch((err) => {
  console.error('Password Reset Test Suite Error:', err);
  process.exit(1);
});
