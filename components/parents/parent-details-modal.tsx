'use client';

import React from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  School,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { ParentRecord } from './status-confirm-modal';

// ============================================================================
// PARENT RECORD DETAILS MODAL COMPONENT (MODULE 3)
// ============================================================================
// What this component does:
// Renders the comprehensive Parent Details view specified in Section 8:
// - Parent Information: Full Name, Email, Contact Number, Registration Date, Status
// - Child / Student Information: Student Name, Grade Level, Classroom Section
// - Status Badges: Clear visual differentiation for Pending, Approved, and Rejected
// - Quick Actions: Approve or Reject buttons directly from the details view
//
// Compliance:
// Complies with Section 8: Only displays fields that exist in the database design.
// ============================================================================

interface ParentDetailsModalProps {
  isOpen: boolean;
  parent: ParentRecord | null;
  onClose: () => void;
  onApprove: (parent: ParentRecord) => void;
  onReject: (parent: ParentRecord) => void;
}

export function ParentDetailsModal({
  isOpen,
  parent,
  onClose,
  onApprove,
  onReject,
}: ParentDetailsModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  if (!isOpen || !parent) return null;

  // Render colored status badge
  const renderBadge = () => {
    switch (parent.status) {
      case 'Approved':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isChild
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isChild
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isChild
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isChild
            ? 'bg-white border-teal-200 text-slate-900'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                isChild
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}
            >
              {parent.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{parent.fullName}</h3>
              <p
                className={`text-xs mt-0.5 ${
                  isChild ? 'text-teal-700 font-medium' : 'text-slate-400'
                }`}
              >
                Parent Registration Details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderBadge()}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="space-y-6">
          {/* Section A: Parent Contact Information */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isChild ? 'text-teal-800' : 'text-teal-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Parent Information</span>
            </h4>

            <div
              className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isChild
                  ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name:
                </span>
                <span className="font-bold">{parent.fullName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address:
                </span>
                <span className="font-semibold">{parent.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact Number:
                </span>
                <span>{parent.contactNumber || 'Not provided'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Registered On:
                </span>
                <span>{new Date(parent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Section B: Linked Child / Student Information */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isChild ? 'text-teal-800' : 'text-teal-400'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Linked Student / Pupil</span>
            </h4>

            <div
              className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isChild
                  ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Pupil Name:
                </span>
                <span className="font-bold text-teal-400">{parent.childName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Grade Level:
                </span>
                <span className="font-semibold">{parent.childGradeLevel}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" /> Class Section:
                </span>
                <span>{parent.childSection || 'Unassigned Section'}</span>
              </div>
            </div>
          </div>

          {/* Rejection Note Display if account is rejected */}
          {parent.status === 'Rejected' && parent.rejectionReason && (
            <div
              className={`p-3.5 rounded-2xl border text-xs ${
                isChild
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-rose-950/30 border-rose-900/50 text-rose-300'
              }`}
            >
              <p className="font-bold mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Rejection Feedback:
              </p>
              <p className="leading-relaxed">{parent.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-inherit">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
              isChild
                ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Close Details
          </button>

          {/* Contextual Action Buttons */}
          <div className="flex items-center gap-2">
            {parent.status !== 'Rejected' && (
              <button
                onClick={() => {
                  onClose();
                  onReject(parent);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isChild
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                Reject Registration
              </button>
            )}

            {parent.status !== 'Approved' && (
              <button
                onClick={() => {
                  onClose();
                  onApprove(parent);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
              >
                Approve Registration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
