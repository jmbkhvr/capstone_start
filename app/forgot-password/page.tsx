'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Mail, ArrowLeft, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// ============================================================================
// FORGOT PASSWORD PAGE COMPONENT
// ============================================================================
// What this component does:
// Renders the interface for teachers requesting a password reset link.
// Collects the teacher's registered email address, validates input presence,
// posts to /api/auth/forgot-password, and displays account-enumeration safe feedback.
//
// Why it is needed:
// Allows teachers to initiate password recovery if they forget their password.
// ============================================================================

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ============================================================================
  // HANDLE FORGOT PASSWORD SUBMISSION
  // ============================================================================
  // Sends entered email address to /api/auth/forgot-password endpoint.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Failed to send password reset link. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message);
      setIsLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Forgot Password</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enter your registered email address to receive a password reset link.
          </p>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset Request Error</p>
              <p className="text-rose-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Feedback Banner */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset Instructions Dispatched</p>
              <p className="text-emerald-300/90">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Forgot Password Form */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        {/* Navigation Link to Login Page */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
