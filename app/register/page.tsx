'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, UserPlus, User, IdCard, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// ============================================================================
// TEACHER REGISTRATION PAGE COMPONENT
// ============================================================================
// What this component does:
// Renders the registration interface for new school teachers.
// Collects Full Name, Teacher ID, Email, Password, and Password Confirmation.
// Performs client-side input validation, sends data to the registration API,
// displays real-time feedback banners, and logs the teacher in automatically upon success.
//
// Why it is needed:
// Allows Grade 3 educators to sign up and establish credentials to access
// the reading proficiency assessment and automated pronunciation scoring system.
// ============================================================================

export default function RegisterPage() {
  const router = useRouter();

  // Form input state variables.
  const [fullName, setFullName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state variables for handling submission state and error/success alerts.
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ============================================================================
  // HANDLE REGISTRATION FORM SUBMISSION
  // ============================================================================
  // Validates inputs client-side, posts to /api/auth/register, and navigates
  // to the dashboard on successful account creation.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    // Client-side quick checks before hitting network.
    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // Send registration request payload to backend endpoint.
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          teacherId,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Display error message returned by server (e.g. duplicate email/ID).
        setErrorMessage(data.message || 'Registration failed. Please check your information.');
        setIsLoading(false);
        return;
      }

      // Display success message and navigate to protected teacher dashboard.
      setSuccessMessage(data.message || 'Registration successful! Redirecting...');

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('Registration request error:', err);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 py-8">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Teacher Account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Register for the Reading Assessment & Pronunciation Scoring Platform
          </p>
        </div>

        {/* Error Feedback Message Box */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Notice</p>
              <p className="text-rose-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Feedback Message Box */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Account Created</p>
              <p className="text-emerald-300/90">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Teacher Full Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Maria Santos"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* School Teacher ID Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Teacher ID Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="T-2026-001"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password (Min 8 Characters)
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
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm Password
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
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Register Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Complete Registration</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Link to Login Page */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 text-center text-sm text-slate-400">
          Already have a teacher account?{' '}
          <Link
            href="/login"
            className="text-teal-400 hover:text-teal-300 font-semibold hover:underline transition-colors"
          >
            Log In Here
          </Link>
        </div>

      </div>
    </div>
  );
}
