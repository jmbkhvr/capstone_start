'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Archive, RotateCcw, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { ReadingMaterialItem } from './material-details-modal';

// ============================================================================
// ARCHIVE & RESTORE CONFIRMATION DIALOG MODAL (MODULE 6)
// ============================================================================
// What this component does:
// Renders an accessible confirmation modal when a teacher chooses to archive or
// restore a reading material.
//
// Data Preservation Guarantee (Section 13):
// Explicitly informs the teacher that archiving safely deactivates the material
// from active assessment selection while permanently preserving historical reading
// evaluation records, word error rates, and speech metrics.
// ============================================================================

interface ArchiveConfirmModalProps {
  material: ReadingMaterialItem | null;
  isOpen: boolean;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchiveConfirmModal({
  material,
  isOpen,
  onClose,
  onArchived,
}: ArchiveConfirmModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !material) return null;

  const isArchived = material.status === 'Archived';
  const actionName = isArchived ? 'Restore' : 'Archive';

  const handleConfirm = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await axios.patch(`/api/reading-materials/${material.id}/archive`, {
        action: isArchived ? 'restore' : 'archive',
      });

      onArchived();
      onClose();
    } catch (err: any) {
      console.error('Error toggling reading material status:', err);
      setErrorMessage(
        err?.response?.data?.error ||
          `Failed to ${actionName.toLowerCase()} reading material. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
          isChild
            ? 'bg-white border-teal-200 text-slate-900'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Top bar with icon and close button */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isArchived
                ? isChild
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500/20 text-emerald-400'
                : isChild
                ? 'bg-amber-100 text-amber-700'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isArchived ? <RotateCcw className="w-6 h-6" /> : <Archive className="w-6 h-6" />}
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isChild ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h3 className={`text-lg font-black mb-2 ${isChild ? 'text-teal-950' : 'text-white'}`}>
          {isArchived ? 'Restore Reading Material?' : 'Archive Reading Material?'}
        </h3>

        {/* Explanation and Preservation Guarantee */}
        <p className={`text-xs leading-relaxed mb-4 ${isChild ? 'text-slate-600' : 'text-slate-300'}`}>
          {isArchived
            ? `You are about to restore "${material.title}" to active status. It will become immediately available for student reading activities and assessments.`
            : `Are you sure you want to archive "${material.title}"?`}
        </p>

        {!isArchived && (
          <div
            className={`p-3.5 rounded-2xl text-xs border mb-5 space-y-1 ${
              isChild
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Data Preservation Notice</span>
            </div>
            <p className="opacity-90 leading-relaxed text-[11px] pl-6">
              This material will not be permanently deleted. Archiving preserves all historical reading records,
              word error logs, and oral assessments while safely removing it from active selection queues.
            </p>
          </div>
        )}

        {errorMessage && (
          <div
            className={`p-3 rounded-xl text-xs border mb-4 text-rose-500 ${
              isChild ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/40 border-rose-900'
            }`}
          >
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div
          className={`flex items-center justify-end gap-3 pt-3 border-t ${
            isChild ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              isChild
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-sm cursor-pointer ${
              isArchived
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isArchived ? 'Restore to Active' : 'Archive Material'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
