'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, LogIn, Mail, Lock, AlertCircle, CheckCircle2, Loader2, Sparkles, Smile } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // Form input state variables.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state variables for handling loading, error messages, and success alerts.
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get optional redirect URL from query string if user was redirected from a protected page.
  const redirectPath = searchParams.get('redirect') || '/dashboard';

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
    <div
      className={`w-full max-w-md backdrop-blur-xl border transition-all duration-300 rounded-3xl p-8 shadow-2xl relative z-10 ${
        isChild
          ? 'bg-white/95 border-teal-200/80 shadow-teal-900/10 text-slate-900'
          : 'bg-slate-800/80 border-slate-700/60 shadow-2xl text-slate-100'
      }`}
    >
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {isChild ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">
              <Smile className="w-4 h-4 text-teal-600" /> Grade 3 Readers
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700/60 text-slate-300 rounded-full text-xs font-medium">
              Teacher Portal
            </span>
          )}
        </div>
        <ThemeToggle />
      </div>

      {/* Header Section */}
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 transition-transform duration-300 ${
            isChild
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105 animate-bounceSlow'
              : 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
          }`}
        >
          {isChild ? <Sparkles className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
        </div>
        <h1
          className={`text-2xl font-bold tracking-tight ${
            isChild ? 'text-teal-950 font-black text-3xl' : 'text-white'
          }`}
        >
          {isChild ? 'Welcome Back, Readers! 🌟' : 'Teacher Portal Login'}
        </h1>
        <p className={`text-sm mt-1.5 ${isChild ? 'text-teal-800 font-medium' : 'text-slate-400'}`}>
          {isChild
            ? 'Sign in to start reading & assessment adventures!'
            : 'Grade 3 Reading Proficiency Assessment System'}
        </p>
      </div>

      {/* Error Feedback Message Box */}
      {errorMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 animate-fadeIn border ${
            isChild
              ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Alert</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Feedback Message Box */}
      {successMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 animate-fadeIn border ${
            isChild
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Successfully Signed In!</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div>
          <label
            className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              isChild ? 'text-teal-900' : 'text-slate-300'
            }`}
          >
            Email Address
          </label>
          <div className="relative">
            <div
              className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                isChild ? 'text-teal-600' : 'text-slate-400'
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu.ph"
              className={`w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-teal-50/50 border-2 border-teal-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-300 font-medium'
                  : 'bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/50'
              }`}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              className={`block text-xs font-bold uppercase tracking-wider ${
                isChild ? 'text-teal-900' : 'text-slate-300'
              }`}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className={`text-xs font-semibold hover:underline transition-colors ${
                isChild ? 'text-teal-700 hover:text-teal-900' : 'text-teal-400 hover:text-teal-300'
              }`}
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <div
              className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                isChild ? 'text-teal-600' : 'text-slate-400'
              }`}
            >
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

        {/* Submit Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-base cursor-pointer ${
            isChild
              ? 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white shadow-teal-500/30 hover:scale-[1.01]'
              : 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white shadow-teal-600/25'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>{isChild ? 'Start Reading Journey 🚀' : 'Log In to Teacher Portal'}</span>
            </>
          )}
        </button>
      </form>

      {/* Navigation Link to Registration */}
      <div
        className={`mt-8 pt-6 border-t text-center text-sm ${
          isChild ? 'border-teal-100 text-teal-900 font-medium' : 'border-slate-700/50 text-slate-400'
        }`}
      >
        Don't have an account yet?{' '}
        <Link
          href="/register"
          className={`font-bold hover:underline transition-colors ${
            isChild ? 'text-teal-700 hover:text-teal-950' : 'text-teal-400 hover:text-teal-300'
          }`}
        >
          Register Here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
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
