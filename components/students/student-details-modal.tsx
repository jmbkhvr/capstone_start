'use client';

import React from 'react';
import {
  X,
  User,
  School,
  Users,
  Calendar,
  Layers,
  Edit2,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { StudentRecord } from './add-student-modal';

// ============================================================================
// COMPONENT INTERFACE DEFINITIONS
// ============================================================================
// Props for the detailed view modal
interface StudentDetailsModalProps {
  isOpen: boolean;
  student: StudentRecord | null;
  onClose: () => void;
  onEdit: (student: StudentRecord) => void;
  onMove: (student: StudentRecord) => void;
  onToggleStatus: (student: StudentRecord) => void;
}

// ============================================================================
// STUDENT DETAILS MODAL COMPONENT (MODULE 5)
// ============================================================================
// What this component does:
// 1. Presents a comprehensive overview of a Grade 3 pupil's profile.
// 2. Shows academic details, classroom assignment, linked parent contact, and status.
// 3. Offers quick action buttons for editing, transferring classroom, or deactivating.
// 4. Fully supports high-contrast text rendering for both Teacher mode and Child mode.
export default function StudentDetailsModal({
  isOpen,
  student,
  onClose,
  onEdit,
  onMove,
  onToggleStatus,
}: StudentDetailsModalProps) {
  // Access global theme state
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // If modal is closed or student is not selected, do not render
  if (!isOpen || !student) return null;

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const isActive = student.status === 'Active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border transition-all duration-200 overflow-hidden flex flex-col max-h-[90vh] ${
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
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                isChild
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-blue-900/40 text-blue-400 border border-blue-800/40'
              }`}
            >
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2
                  className={`text-xl font-bold ${
                    isChild ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {student.fullName}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? isChild
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : isChild
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {student.gradeLevel || 'Enrolled'} Pupil • Enrolled Record
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Section 1: Academic & Classroom Placement */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isChild ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <h3
              className={`text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 ${
                isChild ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <School className="w-4 h-4 text-blue-500" />
              <span>Academic & Classroom Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs text-slate-400 block">Classroom Section</span>
                <span
                  className={`font-semibold ${
                    isChild ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {student.classroomName || 'Assigned Classroom'}
                  {student.classroomSection ? ` — ${student.classroomSection}` : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Grade Level</span>
                <span
                  className={`font-medium flex items-center space-x-1.5 ${
                    isChild ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>{student.gradeLevel || 'Grade 3'}</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">School Year</span>
                <span
                  className={`font-medium ${
                    isChild ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  {student.classroomSchoolYear || 'Current School Year'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Enrollment Status</span>
                <span
                  className={`font-semibold ${
                    isActive
                      ? isChild
                        ? 'text-emerald-700'
                        : 'text-emerald-400'
                      : isChild
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}
                >
                  {student.status === 'Active' ? 'Active Pupil' : 'Inactive (Archived)'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Parent / Guardian Information */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isChild ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <h3
              className={`text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 ${
                isChild ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Linked Parent / Guardian</span>
            </h3>

            {student.parentId ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-semibold ${
                      isChild ? 'text-slate-800' : 'text-white'
                    }`}
                  >
                    {student.parentName || 'Parent Name'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      isChild
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" /> Approved
                  </span>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${
                    isChild ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  {student.parentEmail && (
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{student.parentEmail}</span>
                    </div>
                  )}
                  {student.parentContact && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{student.parentContact}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p
                className={`text-xs italic pt-1 ${
                  isChild ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                No parent or guardian is currently linked to this pupil record. You can link an approved parent via Edit.
              </p>
            )}
          </div>

          {/* Section 3: Record Timestamps */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Enrolled on {formatDate(student.createdAt)}</span>
            </div>
            <span>ID: {student.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 ${
            isChild ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'
          }`}
        >
          {/* Deactivate / Reactivate Action */}
          <button
            onClick={() => onToggleStatus(student)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isActive
                ? isChild
                  ? 'text-rose-600 border border-rose-200 hover:bg-rose-50'
                  : 'text-rose-400 border border-rose-900/60 hover:bg-rose-950/40'
                : isChild
                ? 'text-emerald-600 border border-emerald-200 hover:bg-emerald-50'
                : 'text-emerald-400 border border-emerald-900/60 hover:bg-emerald-950/40'
            }`}
          >
            {isActive ? (
              <>
                <UserX className="w-3.5 h-3.5" />
                <span>Deactivate Pupil</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Restore Pupil</span>
              </>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="flex items-center space-x-2">
            {/* Move Classroom */}
            <button
              onClick={() => onMove(student)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isChild
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                  : 'text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-800/60'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Section</span>
            </button>

            {/* Edit Pupil */}
            <button
              onClick={() => onEdit(student)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
