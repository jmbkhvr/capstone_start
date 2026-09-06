'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  UserCheck,
  AlertCircle,
  Loader2,
  School,
  User,
  Users,
  Layers,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { StudentRecord, ClassroomOption, ParentOption } from './add-student-modal';

// ============================================================================
// COMPONENT INTERFACE DEFINITIONS
// ============================================================================
// Defines props required by EditStudentModal to populate initial values and trigger updates.
interface EditStudentModalProps {
  isOpen: boolean;
  student: StudentRecord | null;
  classrooms: ClassroomOption[];
  parents: ParentOption[];
  onClose: () => void;
  onSuccess: (updatedStudent: StudentRecord) => void;
}

// ============================================================================
// EDIT STUDENT MODAL COMPONENT (MODULE 5)
// ============================================================================
// What this component does:
// 1. Provides a pre-populated form allowing teachers to edit student names, classroom, and parent linkage.
// 2. Validates inputs on submission and sends a PUT request to /api/students/[id].
// 3. Handles duplicate name warnings and updates the UI state reactively upon success.
// 4. Guarantees high-contrast readability in both Teacher mode (dark) and Child mode (light).
export default function EditStudentModal({
  isOpen,
  student,
  classrooms,
  parents,
  onClose,
  onSuccess,
}: EditStudentModalProps) {
  // Access global theme state
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // Form input states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [parentId, setParentId] = useState('');

  // UI status and feedback states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form state whenever the target student changes or modal opens
  useEffect(() => {
    if (student && isOpen) {
      setFirstName(student.firstName || '');
      setMiddleName(student.middleName || '');
      setLastName(student.lastName || '');
      setClassroomId(student.classroomId || '');
      setParentId(student.parentId || '');
      setErrorMessage(null);
    }
  }, [student, isOpen]);

  // If modal is not active or student is null, do not render markup
  if (!isOpen || !student) return null;

  // Handles form submission, payload sanitization, and API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation: First Name, Last Name, and Classroom are mandatory
    if (!firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Last name is required.');
      return;
    }
    if (!classroomId) {
      setErrorMessage('Please assign the pupil to an active classroom.');
      return;
    }

    try {
      setLoading(true);

      // Call API route to update student record
      const response = await axios.put(`/api/students/${student.id}`, {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        classroomId,
        parentId: parentId || null,
      });

      if (response.data?.success && response.data?.student) {
        onSuccess(response.data.student);
        onClose();
      } else {
        setErrorMessage(response.data?.error || 'Failed to update pupil record.');
      }
    } catch (err: any) {
      console.error('[EditStudentModal] Update error:', err);
      const serverMsg = err.response?.data?.error || 'A network error occurred while updating the student.';
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border transition-all duration-200 overflow-hidden flex flex-col max-h-[90vh] ${
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
                isChild
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-blue-900/40 text-blue-400 border border-blue-800/40'
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  isChild ? 'text-slate-900' : 'text-white'
                }`}
              >
                Edit Pupil Profile
              </h2>
              <p className="text-xs text-slate-400">
                Update personal info, classroom, and parent association
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

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-xl text-sm border flex items-start space-x-2.5 ${
                isChild
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-rose-950/50 border-rose-900/60 text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pupil Name Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                First Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                    isChild
                      ? 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600'
                      : 'bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Middle Name (Optional) */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Middle Name <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Santos"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  isChild
                    ? 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Reyes"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                isChild
                  ? 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Grade Level Display (Locked to Grade 3 per capstone spec) */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Target Grade Level
            </label>
            <div
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${
                isChild
                  ? 'bg-slate-100/70 border-slate-200 text-slate-700'
                  : 'bg-slate-800/60 border-slate-700 text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Grade 3 (Phil-IRI Assessment Focus)</span>
            </div>
          </div>

          {/* Classroom Selection */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Assigned Classroom Section <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <School className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <select
                required
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm appearance-none focus:outline-none focus:ring-2 transition-colors ${
                  isChild
                    ? 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30 focus:border-blue-500'
                }`}
              >
                <option value="" disabled>
                  Select active classroom
                </option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id} className={isChild ? '' : 'bg-slate-800 text-white'}>
                    {c.name} {c.section ? `(${c.section})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {classrooms.length === 0 && (
              <p className="mt-1 text-xs text-amber-500">
                No active classrooms available. Create one in Classroom Management first.
              </p>
            )}
          </div>

          {/* Parent Guardian Linkage (Optional) */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Linked Parent / Guardian <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="relative">
              <Users className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm appearance-none focus:outline-none focus:ring-2 transition-colors ${
                  isChild
                    ? 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30 focus:border-blue-500'
                }`}
              >
                <option value="" className={isChild ? '' : 'bg-slate-800 text-white'}>
                  No Parent Assigned (Unlinked)
                </option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id} className={isChild ? '' : 'bg-slate-800 text-white'}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions (Cancel & Save) */}
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
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Update Pupil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
