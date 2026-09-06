'use client';

import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  UserX,
  UserCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { StudentRecord } from './add-student-modal';

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================
// Props for DeactivateConfirmModal to toggle student active/inactive status
interface DeactivateConfirmModalProps {
  isOpen: boolean;
  student: StudentRecord | null;
  onClose: () => void;
  onSuccess: (updatedStudent: StudentRecord) => void;
}

// ============================================================================
// DEACTIVATE / RESTORE CONFIRM MODAL COMPONENT (MODULE 5)
// ============================================================================
// What this component does:
// 1. Confirms the teacher's intention before toggling a pupil's status.
// 2. Explicitly communicates data preservation (no permanent loss of reading records).
// 3. Calls PATCH /api/students/[id]/status and informs parent component on success.
// 4. Guarantees high-contrast readability in both Teacher mode and Child mode.
export default function DeactivateConfirmModal({
  isOpen,
  student,
  onClose,
  onSuccess,
}: DeactivateConfirmModalProps) {
  // Access global theme state
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // Async loading & error feedback states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If modal closed or student null, do not render
  if (!isOpen || !student) return null;

  const isCurrentlyActive = student.status === 'Active';
  const targetStatus = isCurrentlyActive ? 'Inactive' : 'Active';

  // Handles status update API request
  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await axios.patch(`/api/students/${student.id}/status`, {
        status: targetStatus,
      });

      if (response.data?.success && response.data?.student) {
        onSuccess(response.data.student);
        onClose();
      } else {
        setErrorMessage(response.data?.error || 'Failed to update pupil status.');
      }
    } catch (err: any) {
      console.error('[DeactivateConfirmModal] Status update error:', err);
      const serverMsg = err.response?.data?.error || 'A network error occurred while updating status.';
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border transition-all duration-200 overflow-hidden ${
          isChild
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-5 border-b ${
            isChild ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800 bg-slate-900/70'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isCurrentlyActive
                  ? isChild
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
                  : isChild
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
              }`}
            >
              {isCurrentlyActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  isChild ? 'text-slate-900' : 'text-white'
                }`}
              >
                {isCurrentlyActive ? 'Deactivate Pupil Record' : 'Restore Pupil Record'}
              </h2>
              <p className="text-xs text-slate-400">
                {isCurrentlyActive ? 'Archive student from active roster' : 'Re-activate student in classroom'}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-1.5 rounded-lg transition-colors ${
              isChild
                ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm">
          {/* Error Message */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-xl text-sm border flex items-start space-x-2.5 ${
                isChild
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-rose-950/50 border-rose-900/60 text-rose-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Explanation Alert */}
          {isCurrentlyActive ? (
            <div className={`space-y-3 ${isChild ? 'text-slate-600' : 'text-slate-200'}`}>
              <p>
                Are you sure you want to deactivate{' '}
                <strong className={isChild ? 'text-slate-900' : 'text-white'}>
                  {student.fullName}
                </strong>
                ?
              </p>
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isChild
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Data Preservation Guarantee</span>
                </div>
                <p>
                  Deactivating this student will hide them from active classroom reading queues. All past oral reading scores, Phil-IRI diagnostic metrics, and audio recordings remain safely preserved and will NOT be deleted.
                </p>
              </div>
            </div>
          ) : (
            <div className={`space-y-3 ${isChild ? 'text-slate-600' : 'text-slate-200'}`}>
              <p>
                Restore{' '}
                <strong className={isChild ? 'text-slate-900' : 'text-white'}>
                  {student.fullName}
                </strong>{' '}
                back to active status in{' '}
                <strong className={isChild ? 'text-slate-900' : 'text-white'}>
                  {student.classroomName || 'their classroom'}
                </strong>
                ?
              </p>
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isChild
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Ready for Reading Assessments</span>
                </div>
                <p>
                  Restoring this student will make them visible again in active classroom reading sessions and teacher analytics.
                </p>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end space-x-3 ${
              isChild ? 'border-slate-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isChild
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={loading}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${
                isCurrentlyActive
                  ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-500/30'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isCurrentlyActive ? (
                <>
                  <UserX className="w-4 h-4" />
                  <span>Confirm Deactivation</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Restore Pupil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
