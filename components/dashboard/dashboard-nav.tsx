'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  School,
  GraduationCap,
  BookOpen,
  FileCheck2,
  BarChart3,
  TrendingUp,
  Bell,
  UserCircle,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// TEACHER DASHBOARD NAVIGATION COMPONENT
// ============================================================================
// What this component does:
// Renders the primary navigation structure for the Teacher Side of the application:
// - Left-side desktop sidebar with active route highlighting
// - Responsive mobile navigation drawer toggle
// - Navigation links defined in Section 10: Dashboard, Parents, Classrooms, Students,
//   Reading Materials, Assessments, Results & Reports, Monitoring & Progress,
//   Notifications, Profile, and Logout.
//
// Future Module Handling:
// Only currently implemented pages (Dashboard) navigate directly. Future module
// links display an informative modal notification indicating upcoming availability,
// preventing broken 404 links or non-functional navigation.
// ============================================================================

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isImplemented: boolean;
  moduleBadge?: string;
  description: string;
}

interface DashboardNavProps {
  teacherName: string;
  teacherId: string;
  onLogout: () => void;
  isLoggingOut: boolean;
  notificationCount?: number;
}

export function DashboardNav({
  teacherName,
  teacherId,
  onLogout,
  isLoggingOut,
  notificationCount = 0,
}: DashboardNavProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // State to toggle mobile sidebar drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // State to show modal info when clicking a future module
  const [activeNotice, setActiveNotice] = useState<NavItem | null>(null);

  // --------------------------------------------------------------------------
  // Navigation Menu Definitions (as specified in Section 10)
  // --------------------------------------------------------------------------
  const navigationItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      isImplemented: true,
      description: 'Main overview of classes, students, and reading evaluations.',
    },
    {
      name: 'Parents',
      href: '/parents',
      icon: Users,
      isImplemented: true,
      description: 'Review and approve parent registration requests for Grade 3 pupils.',
    },
    {
      name: 'Classrooms',
      href: '/classrooms',
      icon: School,
      isImplemented: true,
      description: 'Create Grade 3 class sections, schedule sessions, and assign students.',
    },
    {
      name: 'Students',
      href: '/students',
      icon: GraduationCap,
      isImplemented: false,
      moduleBadge: 'Module 4',
      description: 'Manage Grade 3 pupil roster, student profiles, and reading levels.',
    },
    {
      name: 'Reading Materials',
      href: '/reading-materials',
      icon: BookOpen,
      isImplemented: false,
      moduleBadge: 'Module 5',
      description: 'Grade 3 passage library, oral reading texts, and comprehension items.',
    },
    {
      name: 'Assessments',
      href: '/assessments',
      icon: FileCheck2,
      isImplemented: false,
      moduleBadge: 'Module 6',
      description: 'Create and administer automated pronunciation and reading tests.',
    },
    {
      name: 'Results & Reports',
      href: '/results-and-reports',
      icon: BarChart3,
      isImplemented: false,
      moduleBadge: 'Module 7',
      description: 'Detailed Phil-IRI diagnostic reports, mispronunciation breakdowns, and exports.',
    },
    {
      name: 'Monitoring & Progress',
      href: '/monitoring-and-progress',
      icon: TrendingUp,
      isImplemented: false,
      moduleBadge: 'Module 8',
      description: 'Longitudinal reading fluency graphs, word error rates, and growth metrics.',
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      isImplemented: false,
      moduleBadge: 'Module 10',
      description: 'System alerts, student completion notices, and parent messages.',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCircle,
      isImplemented: false,
      moduleBadge: 'Module 11',
      description: 'Teacher account credentials, school assignment, and system preferences.',
    },
  ];

  // --------------------------------------------------------------------------
  // Handle click on navigation items
  // --------------------------------------------------------------------------
  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (!item.isImplemented) {
      e.preventDefault();
      setActiveNotice(item);
      setMobileOpen(false);
    } else {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* -------------------------------------------------------------------- */}
      {/* Mobile Top Hamburger Bar                                            */}
      {/* -------------------------------------------------------------------- */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-slate-900 border-slate-800 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Teacher Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Desktop Sidebar Navigation                                          */}
      {/* -------------------------------------------------------------------- */}
      <aside
        className={`hidden lg:flex flex-col w-64 shrink-0 min-h-screen border-r transition-colors duration-300 ${
          isChild
            ? 'bg-white/95 border-teal-200 text-slate-800'
            : 'bg-slate-900/90 border-slate-800 text-slate-200'
        }`}
      >
        {/* Brand Logo & Portal Heading */}
        <div className="p-6 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-transform ${
                isChild
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30 scale-105'
                  : 'bg-teal-500/10 border border-teal-500/30 text-teal-400'
              }`}
            >
              {isChild ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2
                className={`font-black text-sm tracking-tight leading-tight ${
                  isChild ? 'text-teal-950 font-black' : 'text-white'
                }`}
              >
                Grade 3 Reading
              </h2>
              <p
                className={`text-xs font-semibold ${
                  isChild ? 'text-teal-700' : 'text-slate-400'
                }`}
              >
                Teacher Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? isChild
                      ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30 font-bold'
                      : 'bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold'
                    : isChild
                    ? 'text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? isChild
                          ? 'text-white'
                          : 'text-teal-400'
                        : isChild
                        ? 'text-teal-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {/* Status Badges */}
                {isActive ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isChild
                        ? 'bg-white/30 text-white'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    Active
                  </span>
                ) : item.moduleBadge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      isChild
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                    }`}
                  >
                    {item.moduleBadge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Teacher Account Info & Logout Button */}
        <div className="p-4 border-t border-inherit">
          <div
            className={`flex items-center gap-3 p-2 rounded-2xl mb-3 ${
              isChild ? 'bg-teal-50/70 border border-teal-200' : 'bg-slate-800/50 border border-slate-700/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                isChild ? 'bg-teal-500 text-white' : 'bg-teal-600/30 text-teal-300'
              }`}
            >
              {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="text-left text-xs min-w-0 flex-1">
              <p className="font-bold truncate">{teacherName || 'Teacher'}</p>
              <p className={`text-[10px] truncate ${isChild ? 'text-teal-700' : 'text-slate-400'}`}>
                {teacherId}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
              isChild
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- */}
      {/* Mobile Drawer Navigation (When open)                                */}
      {/* -------------------------------------------------------------------- */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer menu content */}
          <div
            className={`relative flex flex-col w-4/5 max-w-xs h-full z-10 p-5 shadow-2xl ${
              isChild ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <span className="font-bold text-sm">Teacher Portal</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-teal-500 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.moduleBadge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.moduleBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={onLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Informative Modal Dialog for Upcoming Modules                       */}
      {/* -------------------------------------------------------------------- */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              isChild ? 'bg-white border-teal-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">{activeNotice.name}</h3>
                  <p className="text-xs text-teal-400 font-semibold">{activeNotice.moduleBadge || 'Upcoming Module'}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveNotice(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {activeNotice.description}
              <br />
              <br />
              This feature is planned for development in{' '}
              <strong className="text-teal-400">{activeNotice.moduleBadge || 'a future module'}</strong> as part of the
              Teacher Side Capstone System.
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveNotice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
