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
  Sparkles,
  Star,
  Award,
  Smile,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';

interface TeacherProfile {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (response.ok && data.authenticated && data.teacher) {
          setTeacher(data.teacher);
        } else {
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

  if (loading) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center ${
          isChild ? 'bg-teal-50 text-teal-900' : 'bg-slate-900 text-white'
        }`}
      >
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
        <p className="text-sm font-semibold">Verifying authenticated session...</p>
      </div>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isChild ? 'bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-amber-50/70 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Header Bar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-md ${
          isChild
            ? 'bg-white/80 border-teal-200 shadow-sm'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform ${
                isChild
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30 scale-105'
                  : 'bg-teal-500/10 border border-teal-500/30 text-teal-400'
              }`}
            >
              {isChild ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h1
                className={`font-bold text-base tracking-tight leading-none ${
                  isChild ? 'text-teal-950 font-black' : 'text-white'
                }`}
              >
                Grade 3 Reading Assessment
              </h1>
              <p className={`text-xs mt-0.5 ${isChild ? 'text-teal-700 font-medium' : 'text-slate-400'}`}>
                {isChild ? 'Student Reading Hub 📖' : 'Teacher Portal'}
              </p>
            </div>
          </div>

          {/* User Controls & Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div
              className={`hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl border ${
                isChild
                  ? 'bg-white border-teal-200 text-slate-900 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/50 text-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isChild ? 'bg-teal-500 text-white' : 'bg-teal-600/30 text-teal-300'
                }`}
              >
                {teacher.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold truncate max-w-[120px]">{teacher.fullName}</p>
                <p className={`text-[10px] ${isChild ? 'text-teal-700' : 'text-slate-400'}`}>
                  {teacher.teacherId}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                isChild
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200'
                  : 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30'
              }`}
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Hero Banner */}
        <section
          className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300 border ${
            isChild
              ? 'bg-gradient-to-r from-amber-100 via-teal-100 to-emerald-100 border-teal-200/80 text-slate-900 shadow-teal-900/5'
              : 'bg-gradient-to-r from-teal-900/40 via-slate-900 to-slate-900 border-teal-500/30 text-white'
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold mb-3 ${
                  isChild
                    ? 'bg-white/80 text-teal-900 border border-teal-300 shadow-xs'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                {isChild ? <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>{isChild ? 'Grade 3 Reading Explorer Active 🌟' : 'Module 1: Authentication Active'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                {isChild ? `Hello, Teacher ${teacher.fullName}! 👋` : `Welcome, ${teacher.fullName}!`}
              </h2>
              <p className={`text-sm mt-2 max-w-2xl leading-relaxed ${isChild ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                {isChild
                  ? 'Welcome to the Grade 3 Reading Assessment Hub. All authentication features and reading tools are ready for your pupils!'
                  : 'You have successfully authenticated into the Grade 3 Reading Proficiency Assessment System. Your session state is protected and secured.'}
              </p>
            </div>
            
            <div className="flex shrink-0">
              <div
                className={`p-4 rounded-2xl text-xs space-y-2.5 border min-w-[230px] ${
                  isChild
                    ? 'bg-white/90 border-teal-200 text-slate-800 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold mb-1 ${isChild ? 'text-teal-700' : 'text-teal-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Account Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className={`w-3.5 h-3.5 shrink-0 ${isChild ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="font-semibold truncate">{teacher.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard className={`w-3.5 h-3.5 shrink-0 ${isChild ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>ID: {teacher.teacherId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className={`w-3.5 h-3.5 shrink-0 ${isChild ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="truncate">{teacher.email}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-lg font-extrabold ${isChild ? 'text-teal-950 font-black' : 'text-white'}`}>
              {isChild ? 'Reading Modules & Hubs 📚' : 'Teacher System Modules'}
            </h3>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                isChild
                  ? 'bg-teal-100 text-teal-800 border-teal-200'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Module 1 Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Active Module 1 Card */}
            <div
              className={`rounded-3xl p-6 transition-all duration-300 border relative overflow-hidden group shadow-lg ${
                isChild
                  ? 'bg-white border-teal-300 shadow-teal-900/5 hover:-translate-y-1'
                  : 'bg-slate-900 border-teal-500/40'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                  isChild ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30' : 'bg-teal-500/20 text-teal-300'
                }`}
              >
                {isChild ? <Award className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isChild
                    ? 'bg-teal-100 text-teal-800 border-teal-200'
                    : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                }`}
              >
                Active & Ready 🌟
              </span>
              <h4 className={`text-base font-bold mt-3 ${isChild ? 'text-teal-950 font-black text-lg' : 'text-white'}`}>
                Module 1: Authentication
              </h4>
              <p className={`text-xs mt-2 leading-relaxed ${isChild ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Handles Teacher Registration, Secure Password Hashing (bcrypt), JWT Token Issuance, and Middleware Protection.
              </p>
            </div>

            {/* Classroom Module */}
            <div
              className={`rounded-3xl p-6 border relative transition-all ${
                isChild ? 'bg-white/60 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-500'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isChild ? 'bg-amber-100 text-amber-700' : 'bg-slate-800 text-slate-400'}`}>
                <School className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isChild ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-500 border-slate-700'}`}>
                Future Module
              </span>
              <h4 className={`text-base font-bold mt-3 ${isChild ? 'text-slate-800' : 'text-slate-300'}`}>
                Classroom Management
              </h4>
              <p className="text-xs mt-2 leading-relaxed">
                Manage Grade 3 sections, assign pupils, and configure classroom settings.
              </p>
            </div>

            {/* Pupils Roster */}
            <div
              className={`rounded-3xl p-6 border relative transition-all ${
                isChild ? 'bg-white/60 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-500'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isChild ? 'bg-sky-100 text-sky-700' : 'bg-slate-800 text-slate-400'}`}>
                <Users className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isChild ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-500 border-slate-700'}`}>
                Future Module
              </span>
              <h4 className={`text-base font-bold mt-3 ${isChild ? 'text-slate-800' : 'text-slate-300'}`}>
                Pupils & Roster
              </h4>
              <p className="text-xs mt-2 leading-relaxed">
                Track pupil profiles, reading levels (Phil-IRI standard), and parent links.
              </p>
            </div>

            {/* Reading Materials */}
            <div
              className={`rounded-3xl p-6 border relative transition-all ${
                isChild ? 'bg-white/60 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-500'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isChild ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isChild ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-500 border-slate-700'}`}>
                Future Module
              </span>
              <h4 className={`text-base font-bold mt-3 ${isChild ? 'text-slate-800' : 'text-slate-300'}`}>
                Reading Materials
              </h4>
              <p className="text-xs mt-2 leading-relaxed">
                Grade 3 passage library, comprehension questions, and audio reference models.
              </p>
            </div>

            {/* Assessments */}
            <div
              className={`rounded-3xl p-6 border relative transition-all ${
                isChild ? 'bg-white/60 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-500'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isChild ? 'bg-rose-100 text-rose-700' : 'bg-slate-800 text-slate-400'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isChild ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-500 border-slate-700'}`}>
                Future Module
              </span>
              <h4 className={`text-base font-bold mt-3 ${isChild ? 'text-slate-800' : 'text-slate-300'}`}>
                Pronunciation Assessments
              </h4>
              <p className="text-xs mt-2 leading-relaxed">
                Automated speech-to-text scoring, mispronunciation detection, and reading fluency analysis.
              </p>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
