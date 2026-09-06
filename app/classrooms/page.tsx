'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  School,
  Search,
  PlusCircle,
  Eye,
  Edit3,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Bell,
  Sparkles,
  Layers,
  Calendar,
  Users,
  Filter,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import {
  CreateClassroomModal,
  ClassroomRecord,
} from '@/components/classrooms/create-classroom-modal';
import { EditClassroomModal } from '@/components/classrooms/edit-classroom-modal';
import { ClassroomDetailsModal } from '@/components/classrooms/classroom-details-modal';
import { ArchiveConfirmModal } from '@/components/classrooms/archive-confirm-modal';

// ============================================================================
// CLASSROOM MANAGEMENT MAIN PAGE COMPONENT (MODULE 4)
// ============================================================================
// What this page does:
// 1. Authenticates the teacher session and retrieves their classrooms from /api/classrooms.
// 2. Provides search (by classroom name, grade level, section, or school year)
//    and status filtering ('All', 'Active', 'Archived') with live count badges.
// 3. Displays the classrooms data table with Classroom Name, Grade, School Year,
//    Section, Student Count, Status, and Actions.
// 4. Integrates Create, Edit, View Details, and Archive/Restore workflows with
//    accessible modal dialogs and confirmation checks.
// 5. Handles loading, empty, and error states gracefully with retry capability.
// ============================================================================

interface StatusCounts {
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

export default function ClassroomManagementPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  // Authenticated teacher profile data
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);

  // Classroom records list returned by backend API
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);

  // Category counts for filter tab badges
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, active: 0, archived: 0 });

  // Current active status filter ('All', 'Active', 'Archived')
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Archived'>('All');

  // Real-time search query input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Page loading spinner state
  const [loading, setLoading] = useState<boolean>(true);

  // Error message state
  const [error, setError] = useState<string | null>(null);

  // Success toast notification message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-flight action loading state
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modal visibility states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedDetails, setSelectedDetails] = useState<ClassroomRecord | null>(null);
  const [selectedEdit, setSelectedEdit] = useState<ClassroomRecord | null>(null);
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    classroom: ClassroomRecord | null;
    actionType: 'archive' | 'restore';
  }>({
    isOpen: false,
    classroom: null,
    actionType: 'archive',
  });

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Load Authenticated Teacher Profile
  // --------------------------------------------------------------------------
  const loadTeacherProfile = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data?.teacher) {
        setTeacher(response.data.teacher);
      }
    } catch (err) {
      console.error('Failed to load teacher session:', err);
      router.push('/login?redirect=/classrooms');
    }
  }, [router]);

  // --------------------------------------------------------------------------
  // Load Classrooms from Backend API
  // --------------------------------------------------------------------------
  const loadClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string with active status and search text
      const params = new URLSearchParams();
      if (activeTab !== 'All') {
        params.set('status', activeTab);
      }
      if (searchQuery.trim().length > 0) {
        params.set('search', searchQuery.trim());
      }

      const response = await axios.get(`/api/classrooms?${params.toString()}`);

      setClassrooms(response.data.classrooms || []);
      setCounts(
        response.data.counts || { all: 0, active: 0, archived: 0 }
      );
    } catch (err: any) {
      console.error('Error retrieving classrooms:', err);
      const msg =
        err.response?.data?.error ||
        'Failed to load classroom records. Please check your connection and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  // --------------------------------------------------------------------------
  // Initial Page Load & Polling Hook
  // --------------------------------------------------------------------------
  useEffect(() => {
    loadTeacherProfile();
  }, [loadTeacherProfile]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  // Automatically clear success toast banner after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // --------------------------------------------------------------------------
  // Handle Teacher Logout
  // --------------------------------------------------------------------------
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await axios.post('/api/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // --------------------------------------------------------------------------
  // Callback: Classroom Created Successfully
  // --------------------------------------------------------------------------
  const handleClassroomCreated = (newClassroom: ClassroomRecord) => {
    setSuccessMessage(`Classroom "${newClassroom.name}" created successfully.`);
    loadClassrooms();
  };

  // --------------------------------------------------------------------------
  // Callback: Classroom Updated Successfully
  // --------------------------------------------------------------------------
  const handleClassroomUpdated = (updatedClassroom: ClassroomRecord) => {
    setSuccessMessage(`Classroom "${updatedClassroom.name}" updated successfully.`);
    loadClassrooms();
  };

  // --------------------------------------------------------------------------
  // Execute Archive / Restore Confirmation Action
  // --------------------------------------------------------------------------
  const handleConfirmArchive = async () => {
    if (!archiveModal.classroom) return;

    try {
      setActionLoading(true);
      const targetAction = archiveModal.actionType;

      const response = await axios.patch(
        `/api/classrooms/${archiveModal.classroom.id}/archive`,
        { action: targetAction }
      );

      setSuccessMessage(
        response.data?.message ||
          `Classroom ${targetAction === 'archive' ? 'archived' : 'restored'} successfully.`
      );

      setArchiveModal({ isOpen: false, classroom: null, actionType: 'archive' });
      loadClassrooms();
    } catch (err: any) {
      console.error('Failed to update classroom archive status:', err);
      const msg =
        err.response?.data?.error ||
        'Failed to update classroom status. Please try again.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${
        isChild
          ? 'bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-amber-50/60 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Left Navigation Sidebar                                             */}
      {/* -------------------------------------------------------------------- */}
      <DashboardNav
        teacherName={teacher?.fullName || 'Teacher'}
        teacherId={teacher?.teacherId || 'T-2026-001'}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        notificationCount={0}
      />

      {/* -------------------------------------------------------------------- */}
      {/* Main Content Area                                                   */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header
          className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
            isChild
              ? 'bg-white/80 border-teal-200 shadow-xs'
              : 'bg-slate-900/80 border-slate-800'
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
                Classroom Management
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Notification Bell */}
              <div
                className={`p-2 rounded-xl border transition-colors ${
                  isChild
                    ? 'border-teal-200 bg-white text-slate-600'
                    : 'border-slate-800 bg-slate-900 text-slate-300'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>

              {/* Teacher Greeting Badge */}
              <div
                className={`hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium ${
                  isChild
                    ? 'bg-teal-50 border-teal-200 text-teal-900'
                    : 'bg-slate-800/60 border-slate-700 text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>{teacher?.fullName || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Success Toast Banner */}
          {successMessage && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <span className="font-semibold">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Alert Banner */}
          {error && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadClassrooms}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Action Header Card: Title, Search, and Create Button */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isChild
                ? 'bg-white border-amber-200 shadow-sm'
                : 'bg-slate-900 border-slate-800 shadow-xl'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Classrooms Roster</h2>
                <p
                  className={`text-xs mt-1 ${
                    isChild ? 'text-amber-800/70' : 'text-slate-400'
                  }`}
                >
                  Manage Grade 3 sections, review assigned pupils, and organize school years
                </p>
              </div>

              {/* Create Classroom Trigger Button */}
              <button
                id="create-classroom-btn"
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all ${
                  isChild
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Classroom</span>
              </button>
            </div>

            {/* Filter Controls Row: Status Tabs & Search Input */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t ${
              isChild ? 'border-slate-200/60' : 'border-slate-800'
            }`}>
              {/* Status Filter Tabs */}
              <div className={`flex items-center gap-1.5 p-1 rounded-xl border self-start transition-colors ${
                isChild
                  ? 'bg-slate-100 border-slate-200'
                  : 'bg-slate-900/90 border-slate-800'
              }`}>
                {(['All', 'Active', 'Archived'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const count =
                    tab === 'All'
                      ? counts.all
                      : tab === 'Active'
                      ? counts.active
                      : counts.archived;

                  return (
                    <button
                      key={tab}
                      id={`tab-${tab.toLowerCase()}`}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? isChild
                            ? 'bg-white text-amber-900 shadow-sm font-bold'
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
                              ? 'bg-amber-100 text-amber-800 font-bold'
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

              {/* Search Bar Input */}
              <div className="relative w-full sm:w-72">
                <input
                  id="search-classrooms-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search classrooms..."
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 ${
                    isChild
                      ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800 placeholder-slate-400'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-emerald-500 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Data Table / Content Area */}
          {/* ---------------------------------------------------------------- */}
          {loading ? (
            /* Loading State */
            <div
              className={`flex flex-col items-center justify-center p-16 rounded-2xl border ${
                isChild
                  ? 'bg-white border-amber-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-semibold text-slate-400">
                Loading classrooms...
              </p>
            </div>
          ) : classrooms.length === 0 ? (
            /* Empty State */
            <div
              className={`flex flex-col items-center justify-center p-16 rounded-2xl border text-center ${
                isChild
                  ? 'bg-white border-amber-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div
                className={`p-4 rounded-2xl mb-4 ${
                  isChild
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                <School className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold">No classrooms found</h3>
              <p
                className={`text-xs max-w-sm mt-1 mb-6 leading-relaxed ${
                  isChild ? 'text-amber-800/70' : 'text-slate-400'
                }`}
              >
                {searchQuery
                  ? `No classrooms matching "${searchQuery}" in ${activeTab.toLowerCase()} classes.`
                  : 'Create your first classroom to get started with Grade 3 reading assessments.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all ${
                  isChild
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Classroom</span>
              </button>
            </div>
          ) : (
            /* Classrooms Data Table */
            <div
              className={`rounded-2xl border overflow-hidden transition-all shadow-xl ${
                isChild
                  ? 'bg-white border-amber-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                        isChild
                          ? 'border-amber-100 bg-amber-50/70 text-slate-600'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <th className="px-6 py-4">Classroom Name</th>
                      <th className="px-6 py-4">Grade</th>
                      <th className="px-6 py-4">School Year</th>
                      <th className="px-6 py-4">Section</th>
                      <th className="px-6 py-4">Students</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-sm ${isChild ? 'divide-slate-200/50' : 'divide-slate-800/60'}`}>
                    {classrooms.map((classroom) => {
                      const isArchived = classroom.status === 'Archived';

                      return (
                        <tr
                          key={classroom.id}
                          className={`transition-colors ${
                            isChild
                              ? 'hover:bg-amber-50/40'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Classroom Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  isChild
                                    ? 'bg-amber-100/70 text-amber-700'
                                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                                }`}
                              >
                                <School className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-semibold block text-sm">
                                  {classroom.name}
                                </span>
                                {classroom.description && (
                                  <span className="text-xs text-slate-400 line-clamp-1">
                                    {classroom.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Grade Level */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                isChild
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              <Layers className="w-3 h-3 text-emerald-500" />
                              {classroom.gradeLevel}
                            </span>
                          </td>

                          {/* School Year */}
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-300 font-medium">
                              {classroom.schoolYear}
                            </span>
                          </td>

                          {/* Section */}
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-400 font-medium">
                              {classroom.section || '—'}
                            </span>
                          </td>

                          {/* Students Count */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                              <Users className="w-3.5 h-3.5 text-blue-400" />
                              {classroom.studentCount || 0}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isArchived
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isArchived ? (
                                <>
                                  <Archive className="w-3 h-3" />
                                  Archived
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </>
                              )}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedDetails(classroom)}
                                title="View Classroom Details"
                                aria-label={`View details for ${classroom.name}`}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isChild
                                    ? 'hover:bg-amber-100 text-slate-600'
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedEdit(classroom)}
                                title="Edit Classroom"
                                aria-label={`Edit ${classroom.name}`}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isChild
                                    ? 'hover:bg-blue-100 text-blue-600'
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-blue-400'
                                }`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Archive or Restore Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setArchiveModal({
                                    isOpen: true,
                                    classroom,
                                    actionType: isArchived ? 'restore' : 'archive',
                                  })
                                }
                                title={isArchived ? 'Restore Classroom' : 'Archive Classroom'}
                                aria-label={`${isArchived ? 'Restore' : 'Archive'} ${classroom.name}`}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isArchived
                                    ? isChild
                                      ? 'hover:bg-emerald-100 text-emerald-600'
                                      : 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
                                    : isChild
                                    ? 'hover:bg-amber-100 text-amber-600'
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                                }`}
                              >
                                {isArchived ? (
                                  <RotateCcw className="w-4 h-4" />
                                ) : (
                                  <Archive className="w-4 h-4" />
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
      {/* Modal Dialogs */}
      {/* -------------------------------------------------------------------- */}
      {/* Create Classroom Modal */}
      <CreateClassroomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleClassroomCreated}
      />

      {/* Edit Classroom Modal */}
      <EditClassroomModal
        isOpen={Boolean(selectedEdit)}
        classroom={selectedEdit}
        onClose={() => setSelectedEdit(null)}
        onSuccess={handleClassroomUpdated}
      />

      {/* Classroom Details Modal */}
      <ClassroomDetailsModal
        isOpen={Boolean(selectedDetails)}
        classroom={selectedDetails}
        onClose={() => setSelectedDetails(null)}
        onEdit={(c) => setSelectedEdit(c)}
        onArchive={(c) =>
          setArchiveModal({
            isOpen: true,
            classroom: c,
            actionType: c.status === 'Archived' ? 'restore' : 'archive',
          })
        }
      />

      {/* Archive & Restore Confirmation Modal */}
      <ArchiveConfirmModal
        isOpen={archiveModal.isOpen}
        classroom={archiveModal.classroom}
        actionType={archiveModal.actionType}
        isLoading={actionLoading}
        onClose={() =>
          setArchiveModal({ isOpen: false, classroom: null, actionType: 'archive' })
        }
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
