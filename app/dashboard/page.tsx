'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Users,
  School,
  FileCheck2,
  AlertTriangle,
  Bell,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { RecentAssessmentsTable, AssessmentItem } from '@/components/dashboard/recent-assessments-table';
import { PerformanceChart, PerformanceCategoryData } from '@/components/dashboard/performance-chart';
import { QuickAccess } from '@/components/dashboard/quick-access';

// ============================================================================
// DATA TYPES AND INTERFACES FOR TEACHER DASHBOARD
// ============================================================================
// What this interface defines:
// The structured data shape returned by the backend GET /api/dashboard endpoint:
// - teacher: Active authenticated teacher's account details.
// - summary: High-level KPI metrics (students, classes, tests, at-risk pupils).
// - recentAssessments: List of recent pupil reading evaluations.
// - performanceOverview: Aggregated scores across reading dimensions.
// ============================================================================

interface TeacherAccount {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

interface DashboardSummary {
  totalStudents: number;
  totalClasses: number;
  totalAssessments: number;
  studentsNeedingAttention: number;
}

interface DashboardPayload {
  teacher: TeacherAccount;
  summary: DashboardSummary;
  recentAssessments: AssessmentItem[];
  performanceOverview: PerformanceCategoryData[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // Component State Variables
  // --------------------------------------------------------------------------
  // Holds the loaded dashboard data from the backend API.
  const [data, setData] = useState<DashboardPayload | null>(null);

  // Loading state indicating when dashboard data is being fetched.
  const [loading, setLoading] = useState<boolean>(true);

  // Error state for handling network or server-side retrieval failures.
  const [error, setError] = useState<string | null>(null);

  // Tracks whether the logout request is actively in-flight.
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Notification bell dropdown visibility state.
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Helper to calculate dynamic time-of-day greeting
  // --------------------------------------------------------------------------
  // Determines whether it is currently morning, afternoon, or evening based on
  // the client's local system clock to personalize the teacher's greeting.
  const getGreeting = (): string => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return 'Good morning';
    }
    if (currentHour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  };

  // --------------------------------------------------------------------------
  // Function: Fetch Dashboard Data from Backend API (Plan A - Axios)
  // --------------------------------------------------------------------------
  // Sends a GET request to /api/dashboard using Axios. The backend inspects
  // the HTTP-Only session cookie to identify the authenticated teacher.
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request dashboard information for the authenticated teacher.
      const response = await axios.get<DashboardPayload>('/api/dashboard');
      setData(response.data);
    } catch (err: any) {
      // If the teacher is unauthenticated (HTTP 401), redirect to login page.
      if (err?.response?.status === 401) {
        router.push('/login');
        return;
      }

      // Record developer error log and set user-friendly error message.
      console.error('Failed to load dashboard data:', err);
      setError(
        err?.response?.data?.error ||
        'Unable to load dashboard data. Please check your connection and try again.'
      );
    } finally {
      // Turn off loading spinner once request resolves or fails.
      setLoading(false);
    }
  }, [router]);

  // --------------------------------------------------------------------------
  // Initial Page Load Hook
  // --------------------------------------------------------------------------
  // Automatically loads dashboard data when the component mounts.
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // --------------------------------------------------------------------------
  // Function: Handle Teacher Logout
  // --------------------------------------------------------------------------
  // Sends a POST request to /api/auth/logout to clear the HTTP-Only session
  // cookie, then redirects the user to the login screen.
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (logoutError) {
      console.error('Error during logout:', logoutError);
      setIsLoggingOut(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render: Loading State (Section 14)
  // --------------------------------------------------------------------------
  // Displays a responsive loading animation while dashboard data is retrieved.
  if (loading) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center p-6 ${isChild ? 'bg-teal-50 text-teal-900' : 'bg-slate-950 text-white'
          }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          <h2 className="text-base font-bold">Loading dashboard...</h2>
          <p className="text-xs text-slate-400">
            Retrieving teacher records, class statistics, and reading summaries.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render: Error State (Section 16)
  // --------------------------------------------------------------------------
  // Displays a user-friendly error message with a retry button if the request fails.
  if (error || !data) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center p-6 ${isChild ? 'bg-teal-50 text-teal-900' : 'bg-slate-950 text-white'
          }`}
      >
        <div
          className={`max-w-md w-full rounded-3xl p-8 border shadow-xl text-center ${isChild ? 'bg-white border-rose-200' : 'bg-slate-900 border-rose-900/50'
            }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black mb-2">Unable to load dashboard data</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {error || 'An unexpected error occurred while communicating with the server.'}
          </p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main Dashboard Interface Render (Sections 4 - 10)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isChild
        ? 'bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-amber-50/60 text-slate-900'
        : 'bg-slate-950 text-slate-100'
        }`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Left Sidebar Navigation (Section 10)                                 */}
      {/* -------------------------------------------------------------------- */}
      <DashboardNav
        teacherName={data.teacher.fullName}
        teacherId={data.teacher.teacherId}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        notificationCount={1}
      />

      {/* -------------------------------------------------------------------- */}
      {/* Primary Dashboard Content Area                                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar (Section 4) */}
        <header
          className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${isChild
            ? 'bg-white/80 border-teal-200 shadow-xs'
            : 'bg-slate-900/80 border-slate-800'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Page Title & Context */}
            <div>
              <h1
                className={`font-black text-base sm:text-lg tracking-tight ${isChild ? 'text-teal-950' : 'text-white'
                  }`}
              >
                Teacher Dashboard
              </h1>
              <p
                className={`text-xs font-semibold ${isChild ? 'text-teal-700' : 'text-slate-400'
                  }`}
              >
                Oral Reading Assessment Platform
              </p>
            </div>

            {/* Header Right Controls: Theme Toggle & Notification Area */}
            <div className="flex items-center gap-3">
              <ThemeToggle />

              {/* Notification Bell Dropdown Button (Section 4) */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-2xl border transition-all cursor-pointer ${isChild
                    ? 'bg-white hover:bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {/* Unread notification indicator dot */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                </button>

                {/* Notifications Popover Panel */}
                {showNotifications && (
                  <div
                    className={`absolute right-0 mt-2 w-80 rounded-3xl p-4 shadow-2xl border z-50 animate-fadeIn ${isChild
                      ? 'bg-white border-teal-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-inherit mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-teal-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          Notifications
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div
                        className={`p-3 rounded-2xl text-xs border ${isChild
                          ? 'bg-teal-50/70 border-teal-200'
                          : 'bg-slate-800/60 border-slate-700'
                          }`}
                      >
                        <p className="font-bold text-teal-400 mb-1">
                          Welcome to Teacher Dashboard
                        </p>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          Your dashboard is active. You can monitor class
                          statistics, manage student rosters, and prepare for reading assessments.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Teacher Avatar Badge */}
              <div
                className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border ${isChild
                  ? 'bg-white border-teal-200 text-slate-800 shadow-xs'
                  : 'bg-slate-800/80 border-slate-700/60 text-white'
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${isChild ? 'bg-teal-500 text-white' : 'bg-teal-500/20 text-teal-300'
                    }`}
                >
                  {data.teacher.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <p className="font-bold truncate max-w-[120px]">
                    {data.teacher.fullName}
                  </p>
                  <p
                    className={`text-[10px] ${isChild ? 'text-teal-700' : 'text-slate-400'
                      }`}
                  >
                    {data.teacher.teacherId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* Main Dashboard Body Container                                      */}
        {/* ------------------------------------------------------------------ */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ---------------------------------------------------------------- */}
          {/* Section 5: Welcome Hero Banner with Teacher Info                 */}
          {/* ---------------------------------------------------------------- */}
          <section
            className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300 border ${isChild
              ? 'bg-gradient-to-r from-amber-100/90 via-teal-100/90 to-emerald-100/90 border-teal-200/80 text-slate-900 shadow-teal-900/5'
              : 'bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border-teal-500/30 text-white'
              }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>

                <h2 className="text-2xl sm:text-3xl font-black">
                  {getGreeting()}, {data.teacher.fullName}! 👋
                </h2>
                <p
                  className={`text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed ${isChild ? 'text-slate-700 font-medium' : 'text-slate-300'
                    }`}
                >
                  Here is an overview of your enrolled pupils, active classrooms, and
                  recent reading assessment progress.
                </p>
              </div>

              {/* Quick Status Pill */}
              <div className="flex shrink-0">
                <div
                  className={`p-4 rounded-2xl text-xs space-y-1.5 border min-w-[210px] ${isChild
                    ? 'bg-white/90 border-teal-200 text-slate-800 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                    }`}
                >
                  <p className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                    Assigned Account
                  </p>
                  <p className="font-bold text-sm truncate">{data.teacher.fullName}</p>
                  <p className="text-slate-400 text-xs">ID: {data.teacher.teacherId}</p>
                  <p className="text-slate-400 text-xs truncate">{data.teacher.email}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Section 6: Summary Cards Grid (4 Minimum KPIs)                    */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Students */}
              <SummaryCard
                title="Total Students"
                value={data.summary.totalStudents}
                subtitle="Enrolled pupils in your active classes"
                emptyHint="No pupils have been enrolled yet. Add students in Student Management."
                icon={Users}
                iconBgClass={isChild ? 'bg-sky-100' : 'bg-sky-500/10'}
                iconColorClass={isChild ? 'text-sky-700' : 'text-sky-400'}
                badgeText="Roster"
              />

              {/* Card 2: Total Classes */}
              <SummaryCard
                title="Total Classes"
                value={data.summary.totalClasses}
                subtitle="Classroom sections created & managed"
                emptyHint="No classrooms created yet. Set up sections in Classroom Management."
                icon={School}
                iconBgClass={isChild ? 'bg-amber-100' : 'bg-amber-500/10'}
                iconColorClass={isChild ? 'text-amber-700' : 'text-amber-400'}
                badgeText="Sections"
              />

              {/* Card 3: Total Assessments */}
              <SummaryCard
                title="Assessments"
                value={data.summary.totalAssessments}
                subtitle="Reading tests conducted this term"
                emptyHint="No reading assessments recorded yet. Administer tests in Assessments."
                icon={FileCheck2}
                iconBgClass={isChild ? 'bg-emerald-100' : 'bg-emerald-500/10'}
                iconColorClass={isChild ? 'text-emerald-700' : 'text-emerald-400'}
                badgeText="Evaluations"
              />

              {/* Card 4: Students Needing Attention */}
              <SummaryCard
                title="Needs Attention"
                value={data.summary.studentsNeedingAttention}
                subtitle="Pupils requiring reading intervention"
                emptyHint="Reading risk indicators will calculate once tests are completed."
                icon={AlertTriangle}
                iconBgClass={isChild ? 'bg-rose-100' : 'bg-rose-500/10'}
                iconColorClass={isChild ? 'text-rose-700' : 'text-rose-400'}
                badgeText="Intervention"
              />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Middle Section: Performance Chart & Recent Assessments           */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Section 8: Student Performance Overview (Recharts) */}
            <div className="lg:col-span-6">
              <PerformanceChart data={data.performanceOverview} />
            </div>

            {/* Section 7: Recent Assessments Table */}
            <div className="lg:col-span-6">
              <RecentAssessmentsTable assessments={data.recentAssessments} />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Section 9: Quick Access Action Grid                              */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <QuickAccess />
          </section>

        </main>
      </div>
    </div>
  );
}
