'use client';

import React from 'react';
import {
  X,
  School,
  Calendar,
  Layers,
  User,
  Users,
  Clock,
  FileText,
  Edit3,
  Archive,
  RotateCcw,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import type { ClassroomRecord } from './create-classroom-modal';

// ============================================================================
// CLASSROOM DETAILS MODAL COMPONENT (MODULE 4)
// ============================================================================
// What this component does:
// 1. Presents a comprehensive overview of a classroom's configuration and status.
// 2. Shows Classroom Name, Grade Level, School Year, Section, Teacher Name,
//    Student Count, Created Date, and Description.
// 3. Includes an informative note clarifying that full Student Enrollment & Management
//    will be available in Module 5.
// 4. Provides quick-action buttons to directly Edit or Archive the classroom.
// ============================================================================

interface ClassroomDetailsModalProps {
  isOpen: boolean;
  classroom: ClassroomRecord | null;
  onClose: () => void;
  onEdit: (classroom: ClassroomRecord) => void;
  onArchive: (classroom: ClassroomRecord) => void;
}

export function ClassroomDetailsModal({
  isOpen,
  classroom,
  onClose,
  onEdit,
  onArchive,
}: ClassroomDetailsModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  if (!isOpen || !classroom) return null;

  // Format creation timestamp
  const formattedCreatedDate = classroom.createdAt
    ? new Date(classroom.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const isArchived = classroom.status === 'Archived';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="classroom-details-title"
    >
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border transition-all overflow-hidden ${
          isChild
            ? 'bg-white border-amber-200 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isChild
              ? 'border-amber-100 bg-amber-50/70'
              : 'border-slate-800 bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isChild
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="classroom-details-title"
                className="text-lg font-bold tracking-tight"
              >
                Classroom Details
              </h2>
              <p
                className={`text-xs ${
                  isChild ? 'text-amber-800/70' : 'text-slate-400'
                }`}
              >
                Overview of classroom configuration and pupil enrollment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Main Classroom Title Card */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between ${
              isChild
                ? 'bg-amber-50/50 border-amber-200/70'
                : 'bg-slate-800/50 border-slate-800'
            }`}
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Classroom Name
              </span>
              <h3 className="text-xl font-bold mt-0.5">{classroom.name}</h3>
              {classroom.section && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Section: <span className="font-semibold">{classroom.section}</span>
                </p>
              )}
            </div>

            {/* Status Pill Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isArchived
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isArchived ? (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  Archived
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </>
              )}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Grade Level */}
            <div
              className={`p-3.5 rounded-xl border ${
                isChild
                  ? 'bg-amber-50/30 border-amber-100'
                  : 'bg-slate-800/30 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Grade Level
              </div>
              <p className="text-sm font-bold">{classroom.gradeLevel}</p>
            </div>

            {/* School Year */}
            <div
              className={`p-3.5 rounded-xl border ${
                isChild
                  ? 'bg-amber-50/30 border-amber-100'
                  : 'bg-slate-800/30 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                School Year
              </div>
              <p className="text-sm font-bold">{classroom.schoolYear}</p>
            </div>

            {/* Assigned Teacher */}
            <div
              className={`p-3.5 rounded-xl border ${
                isChild
                  ? 'bg-amber-50/30 border-amber-100'
                  : 'bg-slate-800/30 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Teacher
              </div>
              <p className="text-sm font-bold truncate">
                {classroom.teacherName || 'Assigned Teacher'}
              </p>
            </div>

            {/* Total Students */}
            <div
              className={`p-3.5 rounded-xl border ${
                isChild
                  ? 'bg-amber-50/30 border-amber-100'
                  : 'bg-slate-800/30 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                Students Enrolled
              </div>
              <p className="text-sm font-bold">
                {classroom.studentCount || 0} pupils
              </p>
            </div>
          </div>

          {/* Module 5 Student Assignment Note */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              isChild
                ? 'bg-blue-50/70 border-blue-200 text-blue-800'
                : 'bg-blue-950/20 border-blue-800/40 text-blue-300'
            }`}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <p className="font-semibold">Student Management Notice</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">
                Student roster assignment, enrollment, and individual pupil profiles
                will be managed in <strong>Module 5 (Student Management Module)</strong>.
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              Classroom Description / Schedule
            </div>
            <p
              className={`text-sm p-3 rounded-xl border leading-relaxed ${
                isChild
                  ? 'bg-amber-50/30 border-amber-100 text-slate-700'
                  : 'bg-slate-800/40 border-slate-800 text-slate-300'
              }`}
            >
              {classroom.description || 'No specific description provided for this classroom.'}
            </p>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Classroom created on {formattedCreatedDate}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800">
            {/* Archive / Restore Button */}
            <button
              id="details-archive-btn"
              type="button"
              onClick={() => {
                onClose();
                onArchive(classroom);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors border ${
                isArchived
                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              {isArchived ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Classroom</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Archive Classroom</span>
                </>
              )}
            </button>

            {/* Right Buttons: Close & Edit */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  isChild
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Close
              </button>
              <button
                id="details-edit-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(classroom);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-md transition-all ${
                  isChild
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Classroom</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
