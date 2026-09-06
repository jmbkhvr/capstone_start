'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  Edit3,
  ArrowRightLeft,
  UserX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Bell,
  Layers,
  School,
  UserCheck,
  UserMinus,
  Mail,
  Filter,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import {
  AddStudentModal,
  StudentRecord,
  ClassroomOption,
  ParentOption,
} from '@/components/students/add-student-modal';
import EditStudentModal from '@/components/students/edit-student-modal';
import StudentDetailsModal from '@/components/students/student-details-modal';
import MoveStudentModal from '@/components/students/move-student-modal';
import DeactivateConfirmModal from '@/components/students/deactivate-confirm-modal';

// ============================================================================
// TYPE DEFINITIONS FOR STUDENT MANAGEMENT (MODULE 5)
// ============================================================================
// Status count summary for tabs
interface StudentStatusCounts {
  all: number;
  active: number;
  inactive: number;
}

// Authenticated Teacher Information
interface TeacherProfile {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

// Toast notification payload
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ============================================================================
// STUDENT MANAGEMENT MAIN PAGE COMPONENT (MODULE 5)
// ============================================================================
// What this page does:
// 1. Authenticates the logged-in teacher session and fetches student roster from /api/students.
// 2. Provides search (by pupil name, parent name) and classroom dropdown filtering.
// 3. Implements status filtering tabs ('All', 'Active', 'Inactive') with real-time counts.
// 4. Renders responsive table displaying pupils with Grade 3 focus, classroom section, parent contact, status, and actions.
// 5. Connects Add, Edit, View Details, Transfer Section, and Deactivate/Restore workflows.
// 6. Supports light/child and dark modes with zero top-spacing visual glitches.
export default function StudentManagementPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // Teacher Profile state
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Student list and options states
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [counts, setCounts] = useState<StudentStatusCounts>({ all: 0, active: 0, inactive: 0 });

  // Filtering and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Helper to trigger autohiding toast notification
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
  }, []);

  // ============================================================================
  // DATA FETCHING: STUDENTS, CLASSROOMS, PARENTS
  // ============================================================================
  // Retrieves students filtered by classroom, status, and search query.
  const fetchStudents = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      // Build search query parameters
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedClassroom !== 'all') params.classroom = selectedClassroom;
      if (statusFilter !== 'All') params.status = statusFilter;

      const response = await axios.get('/api/students', { params });

      if (response.data?.success) {
        setStudents(response.data.students || []);
        setClassrooms(response.data.classrooms || []);
        setParents(response.data.parents || []);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
      } else {
        setErrorMessage(response.data?.error || 'Failed to load students.');
      }
    } catch (err: any) {
      console.error('[StudentManagementPage] Error fetching students:', err);
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setErrorMessage(
        err.response?.data?.error || 'Unable to connect to server. Please check your connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedClassroom, statusFilter, router]);

  // Authenticate session & retrieve teacher profile on mount
  useEffect(() => {
    let mounted = true;

    async function loadTeacherProfile() {
      try {
        const res = await axios.get('/api/dashboard');
        if (mounted && res.data?.success && res.data?.teacher) {
          setTeacher(res.data.teacher);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        }
      }
    }

    loadTeacherProfile();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Trigger data fetch whenever filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ============================================================================
  // LOGOUT HANDLER
  // ============================================================================
  // Clears teacher session and redirects to login
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await axios.post('/api/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('[StudentManagementPage] Logout failed:', err);
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ============================================================================
  // MODAL ACTION HANDLERS
  // ============================================================================
  // Open Student Details Modal
  const handleOpenDetails = (student: StudentRecord) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEdit = (student: StudentRecord) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  // Open Move Student Classroom Modal
  const handleOpenMove = (student: StudentRecord) => {
    setSelectedStudent(student);
    setIsMoveModalOpen(true);
  };

  // Open Deactivate / Restore Confirmation Modal
  const handleOpenToggleStatus = (student: StudentRecord) => {
    setSelectedStudent(student);
    setIsDeactivateModalOpen(true);
  };

  // Callback after student is created
  const handleStudentCreated = (newStudent: StudentRecord) => {
    showToast('success', `Pupil "${newStudent.fullName}" added successfully.`);
    fetchStudents(true);
  };

  // Callback after student is edited
  const handleStudentUpdated = (updatedStudent: StudentRecord) => {
    showToast('success', `Pupil "${updatedStudent.fullName}" updated successfully.`);
    fetchStudents(true);
  };

  // Callback after student is transferred to another classroom
  const handleStudentMoved = (updatedStudent: StudentRecord) => {
    showToast(
      'success',
      `Pupil "${updatedStudent.fullName}" transferred to ${updatedStudent.classroomName || 'new classroom'}.`
    );
    fetchStudents(true);
  };

  // Callback after status toggled (Active / Inactive)
  const handleStatusToggled = (updatedStudent: StudentRecord) => {
    const action = updatedStudent.status === 'Active' ? 'restored' : 'deactivated';
    showToast('info', `Pupil "${updatedStudent.fullName}" marked as ${action}.`);
    fetchStudents(true);
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isChild
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
          className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${isChild
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
                className={`font-black text-base sm:text-lg tracking-tight ${isChild ? 'text-teal-950' : 'text-white'
                  }`}
              >
                Student Management
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Notification Bell */}
              <div
                className={`p-2 rounded-xl border transition-colors ${isChild
                    ? 'border-teal-200 bg-white text-slate-600'
                    : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
              >
                <Bell className="w-5 h-5" />
              </div>

              {/* Teacher Greeting Badge */}
              <div
                className={`hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium ${isChild
                    ? 'bg-teal-50 border-teal-200 text-teal-900'
                    : 'bg-slate-800/60 border-slate-700 text-slate-200'
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{teacher ? teacher.fullName : 'Teacher Account'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Toast Notification Alert Banner */}
          {toast && (
            <div
              className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-lg transition-all animate-fadeIn ${toast.type === 'success'
                  ? isChild
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                  : toast.type === 'error'
                    ? isChild
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-rose-950/60 border-rose-800 text-rose-200'
                    : isChild
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-blue-950/60 border-blue-800 text-blue-200'
                }`}
            >
              <div className="flex items-center space-x-2.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div
              className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-md ${isChild
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-rose-950/50 border-rose-800 text-rose-200'
                }`}
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => fetchStudents(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Top Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Students Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${isChild
                  ? 'bg-white border-teal-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${isChild ? 'text-slate-500' : 'text-slate-400'
                      }`}
                  >
                    Total Grade 3 Pupils
                  </p>
                  <p
                    className={`text-2xl font-black mt-1 ${isChild ? 'text-slate-900' : 'text-white'
                      }`}
                  >
                    {counts.all}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isChild
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-blue-900/40 text-blue-400 border border-blue-800/40'
                    }`}
                >
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Enrolled across all sections</p>
            </div>

            {/* Active Pupils Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${isChild
                  ? 'bg-white border-teal-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${isChild ? 'text-slate-500' : 'text-slate-400'
                      }`}
                  >
                    Active for Reading
                  </p>
                  <p className="text-2xl font-black mt-1 text-emerald-500">
                    {counts.active}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isChild
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40'
                    }`}
                >
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Ready for Phil-IRI assessments</p>
            </div>

            {/* Inactive Pupils Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${isChild
                  ? 'bg-white border-teal-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${isChild ? 'text-slate-500' : 'text-slate-400'
                      }`}
                  >
                    Inactive Records
                  </p>
                  <p
                    className={`text-2xl font-black mt-1 ${isChild ? 'text-slate-600' : 'text-slate-400'
                      }`}
                  >
                    {counts.inactive}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isChild
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                >
                  <UserMinus className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Archived with reading history safe</p>
            </div>
          </div>

          {/* Main Action Bar & Controls */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${isChild
                ? 'bg-white border-teal-100 shadow-sm'
                : 'bg-slate-900/60 border-slate-800'
              }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Status Filter Tabs */}
              <div
                className={`flex items-center space-x-1 p-1 rounded-xl border self-start ${isChild
                    ? 'bg-slate-100 border-slate-200'
                    : 'bg-slate-900/90 border-slate-800'
                  }`}
              >
                {(['All', 'Active', 'Inactive'] as const).map((tab) => {
                  const count =
                    tab === 'All'
                      ? counts.all
                      : tab === 'Active'
                        ? counts.active
                        : counts.inactive;
                  const isActive = statusFilter === tab;

                  return (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive
                          ? isChild
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-emerald-600 text-white shadow-xs'
                          : isChild
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <span>{tab}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive
                            ? 'bg-white/20 text-white'
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

              {/* Search, Classroom Filter, and Add Button */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px] sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search pupils or parents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 transition-colors ${isChild
                        ? 'bg-white border-teal-200 text-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                        : 'bg-slate-800/70 border-slate-700 text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Classroom Filter Dropdown */}
                <div className="relative">
                  <select
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    className={`pl-3.5 pr-8 py-2 rounded-xl border text-xs appearance-none focus:outline-none focus:ring-2 transition-colors ${isChild
                        ? 'bg-white border-teal-200 text-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                        : 'bg-slate-800/70 border-slate-700 text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                  >
                    <option value="all">All Classrooms</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => fetchStudents(true)}
                  disabled={refreshing}
                  className={`p-2 rounded-xl border transition-colors ${isChild
                      ? 'border-teal-200 text-slate-600 hover:bg-teal-50'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  title="Refresh student list"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                {/* Add Student Primary Action */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${isChild
                      ? 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 shadow-teal-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-500/30'
                    }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Pupil</span>
                </button>
              </div>
            </div>
          </div>

          {/* Students Data Table Container */}
          <div
            className={`rounded-2xl border overflow-hidden transition-all ${isChild
                ? 'bg-white border-teal-100 shadow-sm'
                : 'bg-slate-900/60 border-slate-800'
              }`}
          >
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm font-medium text-slate-400">
                  Loading pupil records...
                </p>
              </div>
            ) : students.length === 0 ? (
              /* Empty State */
              <div className="py-16 px-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold">No pupils found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {searchQuery || selectedClassroom !== 'all' || statusFilter !== 'All'
                    ? 'No pupils match your selected filter criteria. Try clearing the search query or selecting "All Classrooms".'
                    : 'Get started by enrolling Grade 3 pupils to your classrooms for automated reading assessment.'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  {searchQuery || selectedClassroom !== 'all' || statusFilter !== 'All' ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedClassroom('all');
                        setStatusFilter('All');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add First Pupil</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Responsive Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      className={`border-b text-xs font-semibold uppercase tracking-wider ${isChild
                          ? 'border-teal-100 bg-teal-50/50 text-teal-900'
                          : 'border-slate-800 bg-slate-900/90 text-slate-400'
                        }`}
                    >
                      <th className="py-3.5 px-4 sm:px-6">Pupil Name</th>
                      <th className="py-3.5 px-4">Grade</th>
                      <th className="py-3.5 px-4">Classroom Section</th>
                      <th className="py-3.5 px-4">Linked Parent</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-sm ${isChild ? 'divide-teal-50' : 'divide-slate-800/60'}`}>
                    {students.map((student) => {
                      const isActive = student.status === 'Active';
                      const initials = `${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase();

                      return (
                        <tr
                          key={student.id}
                          className={`transition-colors ${isChild ? 'hover:bg-teal-50/30' : 'hover:bg-slate-800/30'
                            }`}
                        >
                          {/* Student Name & Avatar */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className={`font-bold block truncate ${isChild ? 'text-slate-900' : 'text-white'
                                    }`}
                                >
                                  {student.fullName}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  ID: {student.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Grade Level Focus */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isChild
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-800 text-blue-300 border border-slate-700'
                                }`}
                            >
                              <Layers className="w-3 h-3 text-blue-400" />
                              <span>{student.gradeLevel || 'Grade 3'}</span>
                            </span>
                          </td>

                          {/* Classroom Section */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <div
                                className={`font-semibold text-xs flex items-center space-x-1 ${isChild ? 'text-slate-800' : 'text-slate-200'
                                  }`}
                              >
                                <School className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{student.classroomName || 'Classroom'}</span>
                              </div>
                              {student.classroomSection && (
                                <span className="text-[11px] text-slate-400 block">
                                  Section: {student.classroomSection}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Linked Parent */}
                          <td className="py-4 px-4">
                            {student.parentId ? (
                              <div className="space-y-0.5">
                                <span
                                  className={`font-medium text-xs block ${isChild ? 'text-slate-800' : 'text-slate-200'
                                    }`}
                                >
                                  {student.parentName || 'Parent'}
                                </span>
                                {student.parentEmail && (
                                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                                    <Mail className="w-3 h-3 text-slate-500" />
                                    <span className="truncate max-w-[140px]">{student.parentEmail}</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${isChild
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                  }`}
                              >
                                Unlinked
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                                  ? isChild
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                                  : isChild
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                  }`}
                              />
                              {student.status}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => handleOpenDetails(student)}
                                className={`p-1.5 rounded-lg transition-colors ${isChild
                                    ? 'text-teal-700 hover:bg-teal-100'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                                title="View pupil details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className={`p-1.5 rounded-lg transition-colors ${isChild
                                    ? 'text-blue-600 hover:bg-blue-50'
                                    : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800'
                                  }`}
                                title="Edit pupil"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Transfer Section */}
                              <button
                                onClick={() => handleOpenMove(student)}
                                className={`p-1.5 rounded-lg transition-colors ${isChild
                                    ? 'text-indigo-600 hover:bg-indigo-50'
                                    : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                                  }`}
                                title="Transfer classroom section"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              {/* Deactivate or Restore */}
                              <button
                                onClick={() => handleOpenToggleStatus(student)}
                                className={`p-1.5 rounded-lg transition-colors ${isActive
                                    ? isChild
                                      ? 'text-rose-500 hover:bg-rose-50'
                                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                                    : isChild
                                      ? 'text-emerald-600 hover:bg-emerald-50'
                                      : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                                  }`}
                                title={isActive ? 'Deactivate pupil' : 'Restore pupil'}
                              >
                                {isActive ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
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
            )}
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL DIALOGS                                                       */}
      {/* ==================================================================== */}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        classrooms={classrooms}
        parents={parents}
        defaultClassroomId={selectedClassroom !== 'all' ? selectedClassroom : undefined}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleStudentCreated}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditModalOpen}
        student={selectedStudent}
        classrooms={classrooms}
        parents={parents}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={handleStudentUpdated}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={isDetailsModalOpen}
        student={selectedStudent}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedStudent(null);
        }}
        onEdit={(st) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(st);
        }}
        onMove={(st) => {
          setIsDetailsModalOpen(false);
          handleOpenMove(st);
        }}
        onToggleStatus={(st) => {
          setIsDetailsModalOpen(false);
          handleOpenToggleStatus(st);
        }}
      />

      {/* Move Classroom Modal */}
      <MoveStudentModal
        isOpen={isMoveModalOpen}
        student={selectedStudent}
        classrooms={classrooms}
        onClose={() => {
          setIsMoveModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={handleStudentMoved}
      />

      {/* Deactivate / Restore Confirmation Modal */}
      <DeactivateConfirmModal
        isOpen={isDeactivateModalOpen}
        student={selectedStudent}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={handleStatusToggled}
      />
    </div>
  );
}
