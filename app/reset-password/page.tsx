'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

// ============================================================================
// RESET PASSWORD FORM CONTENT (SUSPENSE WRAPPED)
// ============================================================================
// What this component does:
// 1. Reads the reset token from the URL query parameter (?token=...).
// 2. Verifies token validity on mount via /api/auth/verify-reset-token.
// 3. If valid: renders form to enter New Password and Confirm Password.
// 4. If invalid/expired: displays clear warning alert with link to request a new link.
// 5. Submits new password to /api/auth/reset-password and redirects to /login.
// ============================================================================

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  // Token validation state.
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');

  // Form input state.
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Submission state & alert messages.
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ============================================================================
  // VERIFY TOKEN ON MOUNT
  // ============================================================================
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsTokenValid(false);
        setTokenErrorMessage('Missing password reset token in URL request.');
        setIsVerifyingToken(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setTokenErrorMessage(data.message || 'This password reset link is invalid or has expired.');
        }
      } catch (err) {
        console.error('Error verifying reset token:', err);
        setIsTokenValid(false);
        setTokenErrorMessage('Failed to verify password reset token due to a network error.');
      } finally {
        setIsVerifyingToken(false);
      }
    }

    verifyToken();
  }, [token]);

  // ============================================================================
  // HANDLE RESET PASSWORD FORM SUBMISSION
  // ============================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('New password and Confirm Password do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Failed to reset password. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message);

      // Redirect teacher to login page after 2 seconds.
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  // State 1: Verifying token upon page mount.
  if (isVerifyingToken) {
    return (
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/60 rounded-2xl p-8 shadow-2xl text-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
        <p className="text-sm font-medium">Verifying password reset security link...</p>
      </div>
    );
  }

  // State 2: Invalid or expired reset link.
  if (!isTokenValid) {
    return (
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Reset Link Invalid or Expired</h1>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {tokenErrorMessage || 'This password reset link is invalid or has expired. Please request a new password reset link.'}
        </p>

        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Request New Reset Link</span>
          </Link>

          <Link
            href="/login"
            className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Token is valid — render Reset Password Form.
  return (
    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10">
      
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
        <p className="text-slate-400 text-sm mt-1">
          Enter a new password for your teacher account.
        </p>
      </div>

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reset Password Error</p>
            <p className="text-rose-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Feedback Banner */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Password Reset Complete</p>
            <p className="text-emerald-300/90">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            New Password (Min 8 Characters)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Confirm New Password Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Submit Reset Button */}
        <button
          type="submit"
          disabled={isLoading || !!successMessage}
          className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-5 h-5" />
              <span>Reset Password</span>
            </>
          )}
        </button>
      </form>

      {/* Navigation Link to Login */}
      <div className="mt-6 pt-6 border-t border-slate-700/50 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
      </div>

    </div>
  );
}

// ============================================================================
// MAIN RESET PASSWORD PAGE WRAPPER WITH SUSPENSE
// ============================================================================
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
            <span>Loading Reset Interface...</span>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
