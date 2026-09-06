'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Check,
  X as CloseIcon,
  RefreshCw,
  Loader2,
  Bell,
  Sparkles,
  Filter,
  UserCheck,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme-context';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { StatusConfirmModal, ParentRecord } from '@/components/parents/status-confirm-modal';
import { ParentDetailsModal } from '@/components/parents/parent-details-modal';

// ============================================================================
// PARENT MANAGEMENT PAGE COMPONENT (MODULE 3)
// ============================================================================
// What this page does:
// 1. Authenticates the teacher session and loads parent registration requests.
// 2. Provides search (by parent name, email, or child name) and status filtering
//    (All, Pending, Approved, Rejected) with real-time record count badges.
// 3. Renders the Parent Management data table showing Parent Name, Email, Linked Child,
//    Registration Date, Account Status, and actionable controls.
// 4. Integrates confirmation dialogs for approving and rejecting registrations.
// 5. Handles loading, empty, and error states gracefully.
// ============================================================================

interface StatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface TeacherProfile {
  id: string;
  teacherId: string;
  fullName: string;
  email: string;
}

export default function ParentManagementPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  // Authenticated teacher profile data
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);

  // Parent records list returned by backend API
  const [parents, setParents] = useState<ParentRecord[]>([]);

  // Category counts for filter tab badges
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, pending: 0, approved: 0, rejected: 0 });

  // Current active status filter ('All', 'Pending', 'Approved', 'Rejected')
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // Real-time search query input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Page loading spinner state
  const [loading, setLoading] = useState<boolean>(true);

  // Network or server error message state
  const [error, setError] = useState<string | null>(null);

  // Success toast notification message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tracks active in-flight status action requests (Approve / Reject)
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Selected parent record for viewing full details modal
  const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);

  // State to trigger Approve / Reject confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    parent: ParentRecord | null;
  }>({
    isOpen: false,
    type: 'approve',
    parent: null,
  });

  // --------------------------------------------------------------------------
  // Function: Fetch Authenticated Teacher Profile
  // --------------------------------------------------------------------------
  const loadTeacherSession = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data?.authenticated && response.data?.teacher) {
        setTeacher(response.data.teacher);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  // --------------------------------------------------------------------------
  // Function: Fetch Parent Accounts List from Backend API (Plan A - Axios)
  // --------------------------------------------------------------------------
  const loadParents = useCallback(
    async (status: string = activeTab, search: string = searchQuery) => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get('/api/parents', {
          params: {
            status,
            search,
          },
        });

        setParents(response.data.parents || []);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.push('/login');
          return;
        }

        console.error('Error fetching parent records:', err);
        setError(
          err?.response?.data?.error ||
          'Unable to load parent accounts. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchQuery, router]
  );

  // Initial mount hook
  useEffect(() => {
    loadTeacherSession();
    loadParents();
  }, [loadTeacherSession, loadParents]);

  // --------------------------------------------------------------------------
  // Search & Filter Handlers
  // --------------------------------------------------------------------------
  const handleTabChange = (tab: 'All' | 'Pending' | 'Approved' | 'Rejected') => {
    setActiveTab(tab);
    loadParents(tab, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadParents(activeTab, searchQuery);
  };

  // --------------------------------------------------------------------------
  // Function: Execute Approve Parent Registration
  // --------------------------------------------------------------------------
  const handleApproveConfirm = async () => {
    if (!confirmModal.parent) return;
    setActionLoading(true);

    try {
      const response = await axios.patch(`/api/parents/${confirmModal.parent.id}/approve`);
      setSuccessMessage(response.data.message || 'Parent registration approved successfully.');

      // Close confirmation dialog and refresh records
      setConfirmModal({ isOpen: false, type: 'approve', parent: null });
      await loadParents(activeTab, searchQuery);

      // Auto-dismiss success notification after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Approval failed:', err);
      alert(err?.response?.data?.error || 'Failed to approve parent registration.');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Function: Execute Reject Parent Registration
  // --------------------------------------------------------------------------
  const handleRejectConfirm = async (reason?: string) => {
    if (!confirmModal.parent) return;
    setActionLoading(true);

    try {
      const response = await axios.patch(`/api/parents/${confirmModal.parent.id}/reject`, {
        reason,
      });
      setSuccessMessage(response.data.message || 'Parent registration rejected.');

      // Close confirmation dialog and refresh records
      setConfirmModal({ isOpen: false, type: 'reject', parent: null });
      await loadParents(activeTab, searchQuery);

      // Auto-dismiss success notification after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Rejection failed:', err);
      alert(err?.response?.data?.error || 'Failed to reject parent registration.');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Helper: Render Colored Status Badges
  // --------------------------------------------------------------------------
  const renderStatusBadge = (status: ParentRecord['status']) => {
    switch (status) {
      case 'Approved':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isChild
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isChild
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
          >
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isChild
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
          >
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  // --------------------------------------------------------------------------
  // Primary Page Render
  // --------------------------------------------------------------------------
  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isChild
          ? 'bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-amber-50/60 text-slate-900'
          : 'bg-slate-950 text-slate-100'
        }`}
    >
      {/* Sidebar Navigation */}
      <DashboardNav
        teacherName={teacher?.fullName || 'Teacher'}
        teacherId={teacher?.teacherId || 'T-2026'}
        onLogout={async () => {
          await axios.post('/api/auth/logout');
          router.push('/login');
        }}
        isLoggingOut={false}
        notificationCount={counts.pending}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header
          className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${isChild
              ? 'bg-white/80 border-teal-200 shadow-xs'
              : 'bg-slate-900/80 border-slate-800'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div>
              <h1
                className={`font-black text-base sm:text-lg tracking-tight ${isChild ? 'text-teal-950' : 'text-white'
                  }`}
              >
                Parent Management
              </h1>
              <p
                className={`text-xs font-semibold ${isChild ? 'text-teal-700' : 'text-slate-400'
                  }`}
              >
                Review & Authorize Parent Accounts
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div
                className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border ${isChild
                    ? 'bg-white border-teal-200 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700/60 text-white'
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${isChild ? 'bg-teal-500 text-white' : 'bg-teal-500/20 text-teal-300'
                    }`}
                >
                  {teacher?.fullName.charAt(0).toUpperCase() || 'T'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-bold truncate max-w-[120px]">{teacher?.fullName || 'Teacher'}</p>
                  <p className={`text-[10px] ${isChild ? 'text-teal-700' : 'text-slate-400'}`}>
                    {teacher?.teacherId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="p-1 hover:text-white"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 5: Filter Tabs & Live Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

            {/* Status Filter Tabs */}
            <div
              className={`flex items-center p-1 rounded-2xl border ${isChild
                  ? 'bg-white border-teal-200 text-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
            >
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => {
                const count =
                  tab === 'All'
                    ? counts.all
                    : tab === 'Pending'
                      ? counts.pending
                      : tab === 'Approved'
                        ? counts.approved
                        : counts.rejected;

                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                        ? isChild
                          ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/20'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : isChild
                          ? 'hover:bg-teal-50 text-slate-600'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive
                          ? isChild
                            ? 'bg-white/30 text-white'
                            : 'bg-teal-500/30 text-teal-200'
                          : isChild
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parent name, email, or child..."
                className={`w-full text-xs pl-10 pr-20 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 transition-all ${isChild
                    ? 'bg-white border-teal-200 text-slate-900 focus:ring-teal-500'
                    : 'bg-slate-900 border-slate-800 text-white focus:ring-teal-400'
                  }`}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Main Parent Accounts Data Table (Section 6)                      */}
          {/* ---------------------------------------------------------------- */}
          <div
            className={`rounded-3xl border shadow-md overflow-hidden transition-all duration-300 ${isChild ? 'bg-white border-teal-200/80' : 'bg-slate-900/80 border-slate-800'
              }`}
          >
            {/* Loading State (Section 17) */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <p className="text-xs font-bold text-slate-400">Loading parents...</p>
              </div>
            ) : error ? (
              /* Error State (Section 19) */
              <div className="py-16 px-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-rose-400">{error}</h3>
                <button
                  onClick={() => loadParents(activeTab, searchQuery)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : parents.length === 0 ? (
              /* Empty State (Section 18) */
              <div className="py-20 px-4 text-center space-y-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${isChild ? 'bg-teal-100 text-teal-700' : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  <Users className="w-6 h-6" />
                </div>
                <h3
                  className={`text-sm font-bold ${isChild ? 'text-teal-950' : 'text-slate-200'
                    }`}
                >
                  {activeTab === 'Pending'
                    ? 'No pending parent registrations.'
                    : 'No parent accounts found.'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery
                    ? `No matching records found for query "${searchQuery}". Try searching with a different term.`
                    : 'Parent registration requests for Grade 3 pupils will appear here when parents sign up.'}
                </p>
              </div>
            ) : (
              /* Populated Data Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b ${isChild
                          ? 'border-teal-100 text-teal-900 bg-teal-50/50'
                          : 'border-slate-800 text-slate-400 bg-slate-950/40'
                        }`}
                    >
                      <th className="py-4 px-6 font-bold uppercase tracking-wider">Parent Name</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider">Email Address</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider">Child / Pupil</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider">Registration Date</th>
                      <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isChild ? 'divide-teal-50' : 'divide-slate-800/60'
                      }`}
                  >
                    {parents.map((parent) => (
                      <tr
                        key={parent.id}
                        className={`transition-colors ${isChild ? 'hover:bg-teal-50/40' : 'hover:bg-slate-800/30'
                          }`}
                      >
                        {/* Parent Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isChild ? 'bg-teal-500 text-white' : 'bg-teal-500/20 text-teal-300'
                                }`}
                            >
                              {parent.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-bold ${isChild ? 'text-slate-900' : 'text-white'}`}>
                              {parent.fullName}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-6 text-slate-400 font-medium">{parent.email}</td>

                        {/* Child */}
                        <td className="py-4 px-6">
                          <span
                            className={`font-semibold ${isChild ? 'text-teal-800' : 'text-teal-400'
                              }`}
                          >
                            {parent.childName}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {parent.childGradeLevel} • {parent.childSection || 'Section N/A'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">{renderStatusBadge(parent.status)}</td>

                        {/* Date */}
                        <td className="py-4 px-6 text-slate-400">
                          {new Date(parent.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Review / View Details Button */}
                            <button
                              onClick={() => setSelectedParent(parent)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isChild
                                  ? 'bg-slate-100 hover:bg-teal-100 text-slate-700'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                              title="View Full Profile Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{parent.status === 'Pending' ? 'Review' : 'View'}</span>
                            </button>

                            {/* Direct Quick Approve for Pending Accounts */}
                            {parent.status === 'Pending' && (
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    type: 'approve',
                                    parent,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition-all"
                                title="Approve Registration"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Direct Quick Reject for Pending Accounts */}
                            {parent.status === 'Pending' && (
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    type: 'reject',
                                    parent,
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${isChild
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                title="Reject Registration"
                              >
                                <CloseIcon className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Section 8: Parent Details Modal                                      */}
      {/* -------------------------------------------------------------------- */}
      <ParentDetailsModal
        isOpen={Boolean(selectedParent)}
        parent={selectedParent}
        onClose={() => setSelectedParent(null)}
        onApprove={(parent) =>
          setConfirmModal({
            isOpen: true,
            type: 'approve',
            parent,
          })
        }
        onReject={(parent) =>
          setConfirmModal({
            isOpen: true,
            type: 'reject',
            parent,
          })
        }
      />

      {/* -------------------------------------------------------------------- */}
      {/* Section 20: Status Confirmation Modal                                */}
      {/* -------------------------------------------------------------------- */}
      <StatusConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        parent={confirmModal.parent}
        onConfirm={confirmModal.type === 'approve' ? handleApproveConfirm : handleRejectConfirm}
        onClose={() => setConfirmModal({ isOpen: false, type: 'approve', parent: null })}
        isLoading={actionLoading}
      />
    </div>
  );
}
