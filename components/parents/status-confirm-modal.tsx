'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// STATUS CONFIRMATION MODAL COMPONENT (MODULE 3)
// ============================================================================
// What this component does:
// Renders confirmation dialogs before executing critical status updates:
// 1. Approve Parent Registration: Confirms the teacher wants to grant the parent
//    portal access for their Grade 3 child.
// 2. Reject Parent Registration: Prompts the teacher for confirmation and provides
//    an optional input to record the rejection reason.
//
// Compliance:
// Enforces Section 20: Prevents accidental status changes through explicit confirmation.
// ============================================================================

export interface ParentRecord {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  childName: string;
  childGradeLevel: string;
  childSection?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface StatusConfirmModalProps {
  isOpen: boolean;
  type: 'approve' | 'reject';
  parent: ParentRecord | null;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export function StatusConfirmModal({
  isOpen,
  type,
  parent,
  onConfirm,
  onClose,
  isLoading,
}: StatusConfirmModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // State to capture optional reason when rejecting a registration
  const [rejectionReason, setRejectionReason] = useState<string>('');

  if (!isOpen || !parent) return null;

  const isApprove = type === 'approve';

  // Handle submit action
  const handleAction = async () => {
    await onConfirm(isApprove ? undefined : rejectionReason);
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
        {/* Modal Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isApprove
                  ? isChild
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isChild
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isApprove ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-black">
                {isApprove ? 'Approve Parent Registration?' : 'Reject Parent Registration?'}
              </h3>
              <p
                className={`text-xs ${
                  isChild ? 'text-teal-700 font-medium' : 'text-slate-400'
                }`}
              >
                {parent.fullName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Message Content */}
        <div className="space-y-3 mb-6">
          <p
            className={`text-xs leading-relaxed ${
              isChild ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            {isApprove
              ? `Are you sure you want to approve ${parent.fullName}'s registration? Once approved, the parent can access the Reading Assessment Portal for their child (${parent.childName}).`
              : `Are you sure you want to reject ${parent.fullName}'s registration for pupil ${parent.childName}?`}
          </p>

          {/* Optional Rejection Reason Field */}
          {!isApprove && (
            <div className="pt-2">
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-teal-900' : 'text-slate-400'
                }`}
              >
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Student name does not match current class enrollment roster..."
                rows={3}
                className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-slate-50 border-teal-200 text-slate-900 focus:ring-teal-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:ring-teal-400'
                }`}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isChild
                ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isApprove
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isApprove ? 'Approve Registration' : 'Reject Registration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
