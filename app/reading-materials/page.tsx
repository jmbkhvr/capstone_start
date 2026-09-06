'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  BookOpen,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Edit3,
  Archive,
  RotateCcw,
  GraduationCap,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import {
  ReadingMaterialItem,
  MaterialDetailsModal,
} from '@/components/reading-materials/material-details-modal';
import { CreateMaterialModal } from '@/components/reading-materials/create-material-modal';
import { EditMaterialModal } from '@/components/reading-materials/edit-material-modal';
import { ArchiveConfirmModal } from '@/components/reading-materials/archive-confirm-modal';

// ============================================================================
// READING MATERIALS MANAGEMENT PAGE COMPONENT (MODULE 6)
// ============================================================================
// What this page does:
// Serves as the central library for teachers to create, view, edit, and archive
// reading passages that will be used as reference texts for oral reading
// assessments across all grade levels (Grade 1 through Grade 6).
//
// Key Features:
// - Summary KPI cards (Total Passages, Active Passages, Archived Passages).
// - Real-time keyword search (title, description, content).
// - Multi-criteria filtering: Grade Level, Difficulty, Status.
// - Sorting: by creation date, title, or word count.
// - Soft-archiving workflow to preserve future assessment records.
// - 100% theme consistency for both Teacher Mode (dark slate) & Child Mode (light).
// ============================================================================

// Available grade levels for filtering
const GRADE_LEVELS = ['All', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

interface MaterialCounts {
  all: number;
  active: number;
  archived: number;
}

interface TeacherProfile {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

export default function ReadingMaterialsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // Component State
  // --------------------------------------------------------------------------
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [materials, setMaterials] = useState<ReadingMaterialItem[]>([]);
  const [counts, setCounts] = useState<MaterialCounts>({
    all: 0,
    active: 0,
    archived: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Archived'>('All');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Moderate' | 'Difficult'>('All');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'wordCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [detailsMaterial, setDetailsMaterial] = useState<ReadingMaterialItem | null>(null);
  const [editMaterial, setEditMaterial] = useState<ReadingMaterialItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ReadingMaterialItem | null>(null);

  // --------------------------------------------------------------------------
  // Helper: Show brief floating success notification
  // --------------------------------------------------------------------------
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --------------------------------------------------------------------------
  // Data Fetching: Load Reading Materials & Teacher Account
  // --------------------------------------------------------------------------
  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch current teacher profile if not loaded
      if (!teacher) {
        const meRes = await axios.get('/api/auth/me');
        if (meRes.data?.user) {
          setTeacher(meRes.data.user);
        }
      }

      // 2. Fetch filtered reading materials
      const res = await axios.get('/api/reading-materials', {
        params: {
          search: searchQuery,
          status: statusFilter,
          grade: gradeFilter,
          difficulty: difficultyFilter,
          sort: sortBy,
          order: sortOrder,
        },
      });

      setMaterials(res.data.materials || []);
      setCounts(
        res.data.counts || {
          all: 0,
          active: 0,
          archived: 0,
        }
      );
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login?redirect=/reading-materials');
        return;
      }
      console.error('Error fetching reading materials:', err);
      setError(
        err?.response?.data?.error ||
          'Failed to load reading materials. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [teacher, searchQuery, statusFilter, gradeFilter, difficultyFilter, sortBy, sortOrder, router]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    }
  };

  // --------------------------------------------------------------------------
  // Render: Main Interface
  // --------------------------------------------------------------------------
  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${
        isChild
          ? 'bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-amber-50/60 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Left Sidebar Navigation */}
      {/* -------------------------------------------------------------------- */}
      <DashboardNav
        teacherName={teacher?.fullName || 'Teacher'}
        teacherId={teacher?.teacherId || 'T-2026'}
        onLogout={handleLogout}
        isLoggingOut={false}
      />

      {/* -------------------------------------------------------------------- */}
      {/* Main Content Area */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
            isChild ? 'bg-white/80 border-teal-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Teacher Portal</span>
              </div>
              <h1
                className={`font-black text-base sm:text-lg tracking-tight ${
                  isChild ? 'text-teal-950' : 'text-white'
                }`}
              >
                Reading Materials
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {teacher && (
                <div
                  className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border ${
                    isChild
                      ? 'bg-white border-teal-200 text-slate-800 shadow-xs'
                      : 'bg-slate-800/80 border-slate-700/60 text-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isChild ? 'bg-teal-500 text-white' : 'bg-teal-500/20 text-teal-300'
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
              )}
            </div>
          </div>
        </header>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 animate-fadeIn">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs font-bold ${
                isChild
                  ? 'bg-teal-600 text-white border-teal-500 shadow-teal-900/20'
                  : 'bg-emerald-600 text-white border-emerald-500 shadow-black/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Page Body */}
        {/* ------------------------------------------------------------------ */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Welcome Hero Banner */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden transition-all ${
              isChild
                ? 'bg-gradient-to-r from-amber-100/90 via-teal-100/90 to-emerald-100/90 border-teal-200/80 text-slate-900'
                : 'bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border-teal-500/30 text-white'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                    isChild
                      ? 'bg-white/90 text-teal-900 border border-teal-300'
                      : 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Reading Assessment Materials</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">Reading Passages Library</h2>
                <p
                  className={`text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed ${
                    isChild ? 'text-slate-700 font-medium' : 'text-slate-300'
                  }`}
                >
                  Create and organize oral reading passages across multiple grade levels. These reference passages
                  provide the foundational content for pupil oral reading evaluations and pronunciation assessments.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0 ${
                  isChild
                    ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Reading Passage</span>
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Summary Metric Cards (3 KPIs) */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Passages */}
            <div
              className={`p-5 rounded-3xl border transition-all ${
                isChild ? 'bg-white border-teal-200/80 shadow-xs' : 'bg-slate-900/80 border-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isChild ? 'bg-teal-100 text-teal-700' : 'bg-teal-500/10 text-teal-400'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isChild ? 'bg-teal-50 text-teal-700' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Total Library
                </span>
              </div>
              <p className={`text-2xl font-black ${isChild ? 'text-slate-900' : 'text-white'}`}>{counts.all}</p>
              <p className={`text-xs mt-0.5 ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Reading passages in library
              </p>
            </div>

            {/* Active for Assessment */}
            <div
              className={`p-5 rounded-3xl border transition-all ${
                isChild ? 'bg-white border-teal-200/80 shadow-xs' : 'bg-slate-900/80 border-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isChild ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isChild ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Active
                </span>
              </div>
              <p className={`text-2xl font-black ${isChild ? 'text-slate-900' : 'text-white'}`}>{counts.active}</p>
              <p className={`text-xs mt-0.5 ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Ready for assessment use
              </p>
            </div>

            {/* Archived */}
            <div
              className={`p-5 rounded-3xl border transition-all ${
                isChild ? 'bg-white border-teal-200/80 shadow-xs' : 'bg-slate-900/80 border-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isChild ? 'bg-slate-100 text-slate-600' : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  <Archive className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isChild ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Archived
                </span>
              </div>
              <p className={`text-2xl font-black ${isChild ? 'text-slate-900' : 'text-white'}`}>{counts.archived}</p>
              <p className={`text-xs mt-0.5 ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Retired from active use
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Controls Card: Status Tabs, Search, and Filters */}
          {/* ---------------------------------------------------------------- */}
          <div
            className={`rounded-3xl p-6 border transition-all ${
              isChild ? 'bg-white border-teal-200/80 shadow-xs' : 'bg-slate-900/80 border-slate-800 shadow-md'
            }`}
          >
            {/* Row 1: Status Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-inherit">
              <div
                className={`flex items-center gap-1.5 p-1 rounded-xl border self-start transition-colors ${
                  isChild ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {(['All', 'Active', 'Archived'] as const).map((tab) => {
                  const count =
                    tab === 'All'
                      ? counts.all
                      : tab === 'Active'
                      ? counts.active
                      : counts.archived;
                  const isActive = statusFilter === tab;

                  return (
                    <button
                      key={tab}
                      id={`tab-${tab.toLowerCase()}`}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? isChild
                            ? 'bg-white text-teal-800 shadow-sm font-bold'
                            : 'bg-emerald-600 text-white shadow-sm font-bold'
                          : isChild
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{tab}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                          isActive
                            ? isChild
                              ? 'bg-teal-100 text-teal-800 font-bold'
                              : 'bg-white/20 text-white font-bold'
                            : isChild
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Item Count Info */}
              <div className="text-xs text-slate-400 font-medium">
                Showing {materials.length} {materials.length === 1 ? 'passage' : 'passages'}
              </div>
            </div>

            {/* Row 2: Search, Grade Filter, Difficulty Filter, and Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-5">
              {/* Search Bar */}
              <div className="lg:col-span-4 relative">
                <input
                  id="search-materials-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, description, or content..."
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 ${
                    isChild
                      ? 'bg-slate-50 border-slate-200 focus:ring-teal-400 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-white placeholder-slate-500'
                  }`}
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Grade Level Filter */}
              <div className="lg:col-span-3">
                <select
                  id="grade-filter-select"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 ${
                    isChild
                      ? 'bg-slate-50 border-slate-200 focus:ring-teal-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-slate-200'
                  }`}
                >
                  {GRADE_LEVELS.map((gl) => (
                    <option key={gl} value={gl}>{gl === 'All' ? 'All Grades' : gl}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="lg:col-span-2">
                <select
                  id="difficulty-filter-select"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as any)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 ${
                    isChild
                      ? 'bg-slate-50 border-slate-200 focus:ring-teal-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-slate-200'
                  }`}
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Difficult">Difficult</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="lg:col-span-3">
                <select
                  id="sort-materials-select"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split('-');
                    setSortBy(sb as any);
                    setSortOrder(so as any);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 ${
                    isChild
                      ? 'bg-slate-50 border-slate-200 focus:ring-teal-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-slate-200'
                  }`}
                >
                  <option value="createdAt-desc">Newest Added</option>
                  <option value="createdAt-asc">Oldest Added</option>
                  <option value="title-asc">Title (A to Z)</option>
                  <option value="title-desc">Title (Z to A)</option>
                  <option value="wordCount-desc">Word Count (Highest)</option>
                  <option value="wordCount-asc">Word Count (Lowest)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Data Table / List Content */}
          {/* ---------------------------------------------------------------- */}
          {loading ? (
            /* Loading State */
            <div
              className={`flex flex-col items-center justify-center p-16 rounded-3xl border ${
                isChild ? 'bg-white border-teal-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <Loader2 className="w-9 h-9 text-teal-500 animate-spin mb-3" />
              <h3 className={`text-sm font-bold ${isChild ? 'text-slate-800' : 'text-white'}`}>
                Loading reading passages...
              </h3>
              <p className={`text-xs mt-1 ${isChild ? 'text-slate-500' : 'text-slate-400'}`}>
                Retrieving passages from database.
              </p>
            </div>
          ) : error ? (
            /* Error State */
            <div
              className={`flex flex-col items-center justify-center p-12 rounded-3xl border text-center ${
                isChild ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/20 border-rose-800'
              }`}
            >
              <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
              <h3 className="text-sm font-bold text-rose-500">Error Loading Passages</h3>
              <p className={`text-xs mt-1 max-w-md ${isChild ? 'text-slate-700' : 'text-slate-400'}`}>{error}</p>
              <button
                onClick={loadMaterials}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : materials.length === 0 ? (
            /* Empty State */
            <div
              className={`flex flex-col items-center justify-center p-16 rounded-3xl border text-center ${
                isChild ? 'bg-white border-teal-200/80 shadow-xs' : 'bg-slate-900/80 border-slate-800 shadow-md'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                  isChild ? 'bg-teal-100 text-teal-700' : 'bg-teal-500/10 text-teal-400'
                }`}
              >
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className={`text-base font-black ${isChild ? 'text-slate-900' : 'text-white'}`}>
                No reading passages found.
              </h3>
              <p className={`text-xs mt-1 max-w-sm leading-relaxed ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                {searchQuery || gradeFilter !== 'All' || difficultyFilter !== 'All' || statusFilter !== 'All'
                  ? 'No passages matched your filter criteria. Try clearing search or changing filters.'
                  : 'Create your first reading passage to start building your assessment library.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition-colors shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Reading Passage</span>
              </button>
            </div>
          ) : (
            /* Passages Table */
            <div
              className={`rounded-3xl border overflow-hidden shadow-md transition-all ${
                isChild ? 'bg-white border-teal-200/80' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b font-bold uppercase tracking-wider ${
                        isChild
                          ? 'border-slate-200 bg-slate-50/70 text-slate-700'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300'
                      }`}
                    >
                      <th className="py-4 px-6">Title & Summary</th>
                      <th className="py-4 px-4">Grade</th>
                      <th className="py-4 px-4">Difficulty</th>
                      <th className="py-4 px-4">Words</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-sm ${
                      isChild ? 'divide-slate-200/60' : 'divide-slate-800/60'
                    }`}
                  >
                    {materials.map((mat) => {
                      const isArchived = mat.status === 'Archived';
                      const snippet =
                        mat.content.length > 85 ? mat.content.substring(0, 85) + '...' : mat.content;

                      return (
                        <tr
                          key={mat.id}
                          className={`transition-colors ${
                            isChild ? 'hover:bg-teal-50/40' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Title & Preview */}
                          <td className="py-4 px-6">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                                  isChild
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-teal-500/20 text-teal-400'
                                }`}
                              >
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`font-bold text-sm truncate ${
                                    isChild ? 'text-slate-900' : 'text-white'
                                  }`}
                                >
                                  {mat.title}
                                </p>
                                <p
                                  className={`text-xs line-clamp-1 mt-0.5 ${
                                    isChild ? 'text-slate-600' : 'text-slate-400'
                                  }`}
                                >
                                  {mat.description || snippet}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Grade Level */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                isChild
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              }`}
                            >
                              {mat.gradeLevel}
                            </span>
                          </td>

                          {/* Difficulty */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                mat.difficulty === 'Easy'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : mat.difficulty === 'Moderate'
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              {mat.difficulty}
                            </span>
                          </td>

                          {/* Words */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                                isChild
                                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {mat.wordCount}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                isArchived
                                  ? isChild
                                    ? 'bg-slate-100 text-slate-600 border-slate-300'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                  : isChild
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {mat.status}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Button */}
                              <button
                                type="button"
                                onClick={() => setDetailsMaterial(mat)}
                                title="View Details"
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  isChild
                                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-400" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => setEditMaterial(mat)}
                                title="Edit Passage"
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  isChild
                                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                              </button>

                              {/* Archive / Restore Button */}
                              <button
                                type="button"
                                onClick={() => setArchiveTarget(mat)}
                                title={isArchived ? 'Restore Passage' : 'Archive Passage'}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  isArchived
                                    ? isChild
                                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                    : isChild
                                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                                }`}
                              >
                                {isArchived ? (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                ) : (
                                  <Archive className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Interactive Modals */}
      {/* -------------------------------------------------------------------- */}
      {/* 1. Create Modal */}
      <CreateMaterialModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          loadMaterials();
          showToast('Reading passage created successfully.');
        }}
      />

      {/* 2. Details Modal */}
      <MaterialDetailsModal
        material={detailsMaterial}
        isOpen={!!detailsMaterial}
        onClose={() => setDetailsMaterial(null)}
        onEdit={(mat) => {
          setDetailsMaterial(null);
          setEditMaterial(mat);
        }}
        onArchive={(mat) => {
          setDetailsMaterial(null);
          setArchiveTarget(mat);
        }}
      />

      {/* 3. Edit Modal */}
      <EditMaterialModal
        material={editMaterial}
        isOpen={!!editMaterial}
        onClose={() => setEditMaterial(null)}
        onUpdated={() => {
          loadMaterials();
          showToast('Reading passage updated successfully.');
        }}
      />

      {/* 4. Archive / Restore Modal */}
      <ArchiveConfirmModal
        material={archiveTarget}
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onArchived={() => {
          loadMaterials();
          showToast(
            archiveTarget?.status === 'Archived'
              ? 'Reading passage restored to active library.'
              : 'Reading passage archived successfully.'
          );
        }}
      />
    </div>
  );
}
