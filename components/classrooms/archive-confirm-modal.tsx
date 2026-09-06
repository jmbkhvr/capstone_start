'use client';

import React from 'react';
import {
  AlertTriangle,
  Archive,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import type { ClassroomRecord } from './create-classroom-modal';

// ============================================================================
// ARCHIVE & RESTORE CONFIRMATION DIALOG MODAL (MODULE 4)
// ============================================================================
// What this component does:
// 1. Presents a high-visibility confirmation dialog before archiving or restoring.
// 2. Warns the teacher that classrooms contain pupil and assessment records,
//    explaining why data is soft-archived rather than permanently deleted.
// 3. Executes onConfirm callback while showing a loading spinner during API request.
// ============================================================================

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  classroom: ClassroomRecord | null;
  actionType: 'archive' | 'restore';
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ArchiveConfirmModal({
  isOpen,
  classroom,
  actionType,
  onClose,
  onConfirm,
  isLoading,
}: ArchiveConfirmModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  if (!isOpen || !classroom) return null;

  const isArchive = actionType === 'archive';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border transition-all overflow-hidden ${
          isChild
            ? 'bg-white border-amber-200 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isArchive
              ? isChild
                ? 'border-amber-100 bg-amber-50/70'
                : 'border-slate-800 bg-amber-950/20'
              : isChild
              ? 'border-emerald-100 bg-emerald-50/70'
              : 'border-slate-800 bg-emerald-950/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isArchive
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isArchive ? (
                <Archive className="w-5 h-5" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2
                id="archive-modal-title"
                className="text-lg font-bold tracking-tight"
              >
                {isArchive ? 'Archive Classroom?' : 'Restore Classroom?'}
              </h2>
              <p
                className={`text-xs ${
                  isChild ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {classroom.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className={`p-1.5 rounded-lg transition-colors ${
              isChild
                ? 'text-slate-400 hover:text-slate-600 hover:bg-amber-100/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Warning Notice Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
              isArchive
                ? isChild
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : isChild
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {isArchive
                  ? 'Preserving Student & Assessment History'
                  : 'Return to Active Roster'}
              </p>
              <p className="text-xs leading-relaxed opacity-90">
                {isArchive
                  ? 'This classroom may contain associated student enrollment or reading assessment records. Archiving deactivates the classroom without permanently deleting historical data.'
                  : 'Restoring this classroom will reactivate it and display it in your active classrooms list.'}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {isArchive
              ? 'Are you sure you want to archive this classroom? You can view or restore it anytime under the "Archived" tab.'
              : 'Are you sure you want to restore this classroom to active status?'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                isChild
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              id="confirm-archive-submit-btn"
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                isArchive
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isArchive ? 'Archiving...' : 'Restoring...'}</span>
                </>
              ) : isArchive ? (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Archive Classroom</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Classroom</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
