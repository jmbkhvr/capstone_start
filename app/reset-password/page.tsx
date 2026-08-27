'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { theme } = useTheme();
  const isChild = theme === 'child';

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
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Failed to reset password. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Password reset successful!');

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className={`w-full max-w-md backdrop-blur-xl border rounded-3xl p-8 text-center shadow-2xl ${isChild ? 'bg-white/95 border-teal-200 text-teal-900' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
        <p className="text-sm font-semibold">Verifying Security Reset Token...</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className={`w-full max-w-md backdrop-blur-xl border rounded-3xl p-8 shadow-2xl text-center relative z-10 ${isChild ? 'bg-white/95 border-rose-200 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-slate-100'}`}>
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
        <p className={`text-sm mb-6 ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
          {tokenErrorMessage}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-md backdrop-blur-xl border transition-all duration-300 rounded-3xl p-8 shadow-2xl relative z-10 ${
        isChild
          ? 'bg-white/95 border-teal-200/80 shadow-teal-900/10 text-slate-900'
          : 'bg-slate-800/80 border-slate-700/60 shadow-2xl text-slate-100'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/login"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline transition-colors ${
            isChild ? 'text-teal-700 hover:text-teal-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        <ThemeToggle />
      </div>

      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 transition-transform duration-300 ${
            isChild
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105 animate-bounceSlow'
              : 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
          }`}
        >
          {isChild ? <Sparkles className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${isChild ? 'text-teal-950 font-black text-3xl' : 'text-white'}`}>
          {isChild ? 'Create New Password 🔒' : 'Set New Password'}
        </h1>
        <p className={`text-sm mt-1.5 ${isChild ? 'text-teal-800 font-medium' : 'text-slate-400'}`}>
          Please enter your new security password.
        </p>
      </div>

      {errorMessage && (
        <div className={`mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 animate-fadeIn border ${isChild ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reset Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className={`mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 animate-fadeIn border ${isChild ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Success!</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isChild ? 'text-teal-900' : 'text-slate-300'}`}>
            New Password
          </label>
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isChild ? 'text-teal-600' : 'text-slate-400'}`}>
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-teal-50/50 border-2 border-teal-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-300 font-medium'
                  : 'bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/50'
              }`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isChild ? 'text-teal-900' : 'text-slate-300'}`}>
            Confirm New Password
          </label>
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isChild ? 'text-teal-600' : 'text-slate-400'}`}>
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-teal-50/50 border-2 border-teal-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-300 font-medium'
                  : 'bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/50'
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-base cursor-pointer ${
            isChild
              ? 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white shadow-teal-500/30 hover:scale-[1.01]'
              : 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white shadow-teal-600/25'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-5 h-5" />
              <span>{isChild ? 'Save Password & Continue 🚀' : 'Reset Password'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
            <span>Loading Password Reset Form...</span>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
