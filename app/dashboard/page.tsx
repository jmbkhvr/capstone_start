'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  LogOut,
  User,
  IdCard,
  Mail,
  ShieldCheck,
  Users,
  School,
  FileText,
  Activity,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// Interface defining authenticated teacher profile data.
interface TeacherProfile {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

// ============================================================================
// TEACHER DASHBOARD PAGE COMPONENT (PROTECTED ROUTE)
// ============================================================================
// What this component does:
// Renders the protected dashboard landing page for authenticated teachers.
// Upon mounting, it fetches current session data from /api/auth/me.
// If valid, it displays teacher account info and system navigation status.
// Includes a functioning Logout button to terminate the session securely.
//
// Why it is needed:
// Validates that Module 1 Authentication correctly grants access to protected
// pages for logged-in users while blocking unauthorized guests.
// ============================================================================

export default function DashboardPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ============================================================================
  // SESSION VERIFICATION ON MOUNT
  // ============================================================================
  // Requests current session payload from /api/auth/me to confirm authentication.
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (response.ok && data.authenticated && data.teacher) {
          setTeacher(data.teacher);
        } else {
          // If session verification fails, redirect to login page.
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to verify session:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuthSession();
  }, [router]);

  // ============================================================================
  // LOGOUT HANDLER
  // ============================================================================
  // Triggered when teacher clicks the "Logout" button.
  // Calls POST /api/auth/logout to invalidate cookie and redirects to /login.
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      setIsLoggingOut(false);
    }
  };

  // Render loading spinner while checking authentication state.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Verifying authenticated session...</p>
      </div>
    );
  }

  // If no teacher data is available (unauthenticated), component returns null while redirecting.
  if (!teacher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* System Title & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">
                Grade 3 Reading Assessment
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Teacher Portal</p>
            </div>
          </div>

          {/* User Profile Summary & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-teal-600/30 text-teal-300 flex items-center justify-center font-bold text-xs">
                {teacher.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-white">{teacher.fullName}</p>
                <p className="text-slate-400 text-[10px]">{teacher.teacherId}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Module 1 Success Welcome Banner */}
        <section className="bg-gradient-to-r from-teal-900/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Module 1: Authentication Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {teacher.fullName}!
              </h2>
              <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
                You have successfully authenticated into the Grade 3 Reading Proficiency Assessment System.
                Your session state is protected and secured.
              </p>
            </div>
            
            <div className="flex shrink-0">
              <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl text-xs space-y-2 text-slate-300 min-w-[220px]">
                <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Account Credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{teacher.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>ID: {teacher.teacherId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Overview Section (Indicating Authentication Status & Module Boundaries) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Teacher System Modules</h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Current Focus: Module 1 Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Active Authentication Module Card */}
            <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Active & Operational
              </span>
              <h4 className="text-base font-bold text-white mt-2">Module 1: Authentication</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Handles Teacher Registration, Secure Password Hashing (bcrypt), JWT Token Issuance, and Middleware Route Protection.
              </p>
            </div>

            {/* Upcoming Classrooms Module Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-slate-500 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                <School className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                Future Module
              </span>
              <h4 className="text-base font-bold text-slate-300 mt-2">Classroom Management</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage Grade 3 sections, assign pupils, and configure classroom settings.
              </p>
            </div>

            {/* Upcoming Pupils Module Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-slate-500 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                Future Module
              </span>
              <h4 className="text-base font-bold text-slate-300 mt-2">Pupils & Roster</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Track pupil profiles, reading levels (Phil-IRI standard), and parent links.
              </p>
            </div>

            {/* Upcoming Reading Passages Module Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-slate-500 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                Future Module
              </span>
              <h4 className="text-base font-bold text-slate-300 mt-2">Reading Materials</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Grade 3 passage library, comprehension questions, and audio reference models.
              </p>
            </div>

            {/* Upcoming Assessments Module Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-slate-500 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                Future Module
              </span>
              <h4 className="text-base font-bold text-slate-300 mt-2">Pronunciation Assessments</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Automated speech-to-text scoring, mispronunciation detection, and reading fluency analysis.
              </p>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
