'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, LogIn, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// ============================================================================
// TEACHER LOGIN FORM COMPONENT (SUSPENSE WRAPPED)
// ============================================================================
// What this component does:
// Contains the interactive login form logic using Next.js useSearchParams hook.
// Wrapping inside Suspense prevents Next.js CSR bailout errors during static page generation.
// ============================================================================

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form input state variables.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state variables for handling loading, error messages, and success alerts.
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get optional redirect URL from query string if user was redirected from a protected page.
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // ============================================================================
  // HANDLE LOGIN FORM SUBMISSION
  // ============================================================================
  // Sends entered credentials to POST /api/auth/login endpoint.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Login failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Login successful!');

      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 800);
    } catch (err) {
      console.error('Login request error:', err);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10">
      
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Teacher Portal Login</h1>
        <p className="text-slate-400 text-sm mt-1">
          Grade 3 Reading Proficiency Assessment System
        </p>
      </div>

      {/* Error Feedback Message Box */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Failure</p>
            <p className="text-rose-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Feedback Message Box */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authenticated</p>
            <p className="text-emerald-300/90">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu.ph"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Submit Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Log In to Teacher Portal</span>
            </>
          )}
        </button>
      </form>

      {/* Navigation Link to Registration */}
      <div className="mt-8 pt-6 border-t border-slate-700/50 text-center text-sm text-slate-400">
        Don't have a teacher account yet?{' '}
        <Link
          href="/register"
          className="text-teal-400 hover:text-teal-300 font-semibold hover:underline transition-colors"
        >
          Register Here
        </Link>
      </div>

    </div>
  );
}

// ============================================================================
// MAIN PAGE WRAPPER WITH SUSPENSE FALLBACK
// ============================================================================
// What this component does:
// Wraps LoginFormContent in a Suspense boundary to satisfy Next.js CSR requirement.
// ============================================================================
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
            <span>Loading Login Interface...</span>
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
