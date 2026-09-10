'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  UserPlus,
  AlertCircle,
  Loader2,
  School,
  User,
  Users,
  Layers,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { SUPPORTED_GRADE_LEVELS } from '@/lib/constants';

// ============================================================================
// STUDENT RECORD & OPTION TYPE DEFINITIONS
// ============================================================================
export interface StudentRecord {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  gradeLevel: string;
  classroomId: string;
  teacherId: string;
  parentId: string | null;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  classroomName?: string;
  classroomSection?: string;
  classroomSchoolYear?: string;
  parentName?: string;
  parentEmail?: string;
  parentContact?: string;
}

export interface ClassroomOption {
  id: string;
  name: string;
  section?: string | null;
  gradeLevel?: string;
}

export interface ParentOption {
  id: string;
  fullName: string;
  email: string;
  childName?: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  classrooms: ClassroomOption[];
  parents: ParentOption[];
  defaultClassroomId?: string;
  onClose: () => void;
  onSuccess: (newStudent: StudentRecord) => void;
}

// ============================================================================
// ADD STUDENT MODAL COMPONENT (MODULE 5)
// ============================================================================
// What this component does:
// 1. Renders a clean modal form for teachers to create a Grade 3 student profile.
// 2. Collects First Name, Middle Name (optional), Last Name, Grade Level (Grade 3),
//    Classroom assignment, and Parent assignment (optional).
// 3. Validates required inputs and prevents duplicate registrations in the same classroom.
// 4. Calls POST /api/students and refreshes the student roster.
// ============================================================================

export function AddStudentModal({
  isOpen,
  classrooms,
  parents,
  defaultClassroomId = '',
  onClose,
  onSuccess,
}: AddStudentModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // Form State Management
  // --------------------------------------------------------------------------
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 3');
  const [classroomId, setClassroomId] = useState(defaultClassroomId);
  const [parentId, setParentId] = useState('');

  // UI state for loading spinner and error feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize default classroom selection when modal opens
  useEffect(() => {
    if (defaultClassroomId) {
      setClassroomId(defaultClassroomId);
      const matched = classrooms.find((c) => c.id === defaultClassroomId);
      if (matched && (matched as any).gradeLevel) {
        setGradeLevel((matched as any).gradeLevel);
      }
    } else if (classrooms.length > 0 && !classroomId) {
      setClassroomId(classrooms[0].id);
      if ((classrooms[0] as any).gradeLevel) {
        setGradeLevel((classrooms[0] as any).gradeLevel);
      }
    }
  }, [defaultClassroomId, classrooms, classroomId]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Reset Form Inputs
  // --------------------------------------------------------------------------
  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGradeLevel('Grade 3');
    setClassroomId(defaultClassroomId || (classrooms[0]?.id || ''));
    setParentId('');
    setErrorMessage(null);
  };

  // --------------------------------------------------------------------------
  // Handle Modal Close
  // --------------------------------------------------------------------------
  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  // --------------------------------------------------------------------------
  // Handle Form Submission
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate pupil names
    if (!firstName.trim()) {
      setErrorMessage('Please enter the student\'s first name.');
      return;
    }

    if (firstName.trim().length < 2) {
      setErrorMessage('First name must be at least 2 characters.');
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage('Please enter the student\'s last name.');
      return;
    }

    if (lastName.trim().length < 2) {
      setErrorMessage('Last name must be at least 2 characters.');
      return;
    }

    // Validate classroom selection
    if (!classroomId) {
      setErrorMessage('Please select a classroom for this student.');
      return;
    }

    try {
      setLoading(true);

      // Submit POST request to backend API
      const response = await axios.post('/api/students', {
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        gradeLevel: gradeLevel.trim(),
        classroomId: classroomId.trim(),
        parentId: parentId.trim() || undefined,
      });

      // Notify parent page and close modal
      onSuccess(response.data.student);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to add student:', err);
      const msg =
        err.response?.data?.error ||
        'An unexpected error occurred while adding the student. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-title"
    >
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border transition-all overflow-hidden ${
          isChild
            ? 'bg-white border-teal-200 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isChild
              ? 'border-teal-100 bg-teal-50/70'
              : 'border-slate-800 bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isChild
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              }`}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="add-student-title"
                className="text-lg font-bold tracking-tight"
              >
                Add Student Profile
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  isChild ? 'text-teal-800/80' : 'text-slate-400'
                }`}
              >
                Register a pupil and assign to an active classroom
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close dialog"
            className={`p-1.5 rounded-lg transition-colors ${
              isChild
                ? 'text-slate-400 hover:text-slate-600 hover:bg-teal-100/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className={`flex items-start gap-3 p-3 text-sm border rounded-xl animate-fadeIn ${
              isChild
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-red-300 bg-red-950/30 border-red-900/50'
            }`}>
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Student Names Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label
                htmlFor="student-firstname-input"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student-firstname-input"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maria"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-teal-50/30 border-teal-200 focus:ring-teal-400 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-sky-500 text-slate-100 placeholder-slate-500'
                }`}
              />
            </div>

            {/* Middle Name */}
            <div>
              <label
                htmlFor="student-middlename-input"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Middle Name (Optional)
              </label>
              <input
                id="student-middlename-input"
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. Santos"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-teal-50/30 border-teal-200 focus:ring-teal-400 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-sky-500 text-slate-100 placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Last Name & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Last Name */}
            <div>
              <label
                htmlFor="student-lastname-input"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student-lastname-input"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Dela Cruz"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-teal-50/30 border-teal-200 focus:ring-teal-400 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-sky-500 text-slate-100 placeholder-slate-500'
                }`}
              />
            </div>

            {/* Grade Level Selector (Supports Grade 1 through Grade 6) */}
            <div>
              <label
                htmlFor="student-grade-select"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Grade Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="student-grade-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 appearance-none ${
                    isChild
                      ? 'bg-teal-50/30 border-teal-200 focus:ring-teal-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-sky-500 text-slate-100'
                  }`}
                >
                  {/* Dynamically list all supported elementary grades */}
                  {SUPPORTED_GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <Layers className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>

          {/* Classroom Selection Dropdown */}
          <div>
            <label
              htmlFor="student-classroom-select"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Assigned Classroom <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="student-classroom-select"
                required
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 appearance-none ${
                  isChild
                    ? 'bg-teal-50/30 border-teal-200 focus:ring-teal-400 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-sky-500 text-slate-100'
                }`}
              >
                <option value="" disabled>
                  -- Select an Active Classroom --
                </option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `(${c.section})` : ''}
                  </option>
                ))}
              </select>
              <School className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none text-slate-400" />
            </div>
            {classrooms.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                No active classrooms found. Please create a classroom in Classrooms first.
              </p>
            )}
          </div>

          {/* Parent Association Dropdown (Optional) */}
          <div>
            <label
              htmlFor="student-parent-select"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Parent / Guardian (Optional)
            </label>
            <div className="relative">
              <select
                id="student-parent-select"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 appearance-none ${
                  isChild
                    ? 'bg-teal-50/30 border-teal-200 focus:ring-teal-400 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-sky-500 text-slate-100'
                }`}
              >
                <option value="">-- No Parent Account Linked --</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
              <Users className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Links student with an approved parent account for home reading access.
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
            isChild ? 'border-slate-200/50' : 'border-slate-800'
          }`}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                isChild
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              id="submit-add-student-btn"
              type="submit"
              disabled={loading || classrooms.length === 0}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                isChild
                  ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding Student...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
