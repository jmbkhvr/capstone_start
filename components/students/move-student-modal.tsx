'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  ArrowRightLeft,
  School,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { StudentRecord, ClassroomOption } from './add-student-modal';

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================
// Props for MoveStudentModal to transfer pupil between teacher's classrooms
interface MoveStudentModalProps {
  isOpen: boolean;
  student: StudentRecord | null;
  classrooms: ClassroomOption[];
  onClose: () => void;
  onSuccess: (updatedStudent: StudentRecord) => void;
}

// ============================================================================
// MOVE STUDENT MODAL COMPONENT (MODULE 5)
// ============================================================================
// What this component does:
// 1. Allows the teacher to transfer a student from their current classroom section to another.
// 2. Enforces validation to ensure the new classroom is active and belongs to the teacher.
// 3. Calls PATCH /api/students/[id]/classroom and updates local student roster state.
// 4. Guarantees high-contrast readability in both Teacher mode and Child mode.
export default function MoveStudentModal({
  isOpen,
  student,
  classrooms,
  onClose,
  onSuccess,
}: MoveStudentModalProps) {
  // Global theme hook
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // State for destination classroom ID
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize selection whenever modal opens
  useEffect(() => {
    if (student && isOpen) {
      // Find other classrooms that are NOT the student's current classroom
      const otherClassrooms = classrooms.filter((c) => c.id !== student.classroomId);
      if (otherClassrooms.length > 0) {
        setSelectedClassroomId(otherClassrooms[0].id);
      } else {
        setSelectedClassroomId('');
      }
      setErrorMessage(null);
    }
  }, [student, isOpen, classrooms]);

  // If modal closed or student null, do not render
  if (!isOpen || !student) return null;

  // Handles form submission to transfer pupil
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation: New classroom must be chosen and different from current
    if (!selectedClassroomId) {
      setErrorMessage('Please select a destination classroom section.');
      return;
    }
    if (selectedClassroomId === student.classroomId) {
      setErrorMessage('Student is already assigned to this classroom section.');
      return;
    }

    try {
      setLoading(true);

      // Call API route to transfer classroom
      const response = await axios.patch(`/api/students/${student.id}/classroom`, {
        classroomId: selectedClassroomId,
      });

      if (response.data?.success && response.data?.student) {
        onSuccess(response.data.student);
        onClose();
      } else {
        setErrorMessage(response.data?.error || 'Failed to transfer pupil.');
      }
    } catch (err: any) {
      console.error('[MoveStudentModal] Error transferring student:', err);
      const serverMsg = err.response?.data?.error || 'A network error occurred while transferring pupil.';
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Find destination classroom object for preview
  const destClassroom = classrooms.find((c) => c.id === selectedClassroomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
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
                isChild
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-indigo-900/40 text-indigo-400 border border-indigo-800/40'
              }`}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  isChild ? 'text-slate-900' : 'text-white'
                }`}
              >
                Transfer Classroom Section
              </h2>
              <p className="text-xs text-slate-400">
                Move pupil to a different active section
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

        {/* Modal Form */}
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          {/* Error Message */}
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

          {/* Transfer Info Card */}
          <div
            className={`p-4 rounded-xl border text-sm space-y-2 ${
              isChild ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Pupil:</span>
              <span
                className={`font-bold ${
                  isChild ? 'text-slate-800' : 'text-white'
                }`}
              >
                {student.fullName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Current Section:</span>
              <span
                className={`font-semibold ${
                  isChild ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                {student.classroomName || 'Current Classroom'}
                {student.classroomSection ? ` (${student.classroomSection})` : ''}
              </span>
            </div>
          </div>

          {/* Destination Classroom Dropdown */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Destination Classroom Section <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <School className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <select
                required
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm appearance-none focus:outline-none focus:ring-2 transition-colors ${
                  isChild
                    ? 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-600'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:ring-indigo-500/30 focus:border-indigo-500'
                }`}
              >
                <option value="" disabled>
                  Select target section
                </option>
                {classrooms.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={c.id === student.classroomId}
                    className={isChild ? '' : 'bg-slate-800 text-white'}
                  >
                    {c.name} {c.section ? `(${c.section})` : ''} {c.id === student.classroomId ? '— [Current]' : ''}
                  </option>
                ))}
              </select>
            </div>
            {classrooms.length <= 1 && (
              <p className="mt-1 text-xs text-amber-500">
                You have only 1 classroom. Create another classroom before transferring students.
              </p>
            )}
          </div>

          {/* Transfer Preview Notice */}
          {destClassroom && destClassroom.id !== student.classroomId && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                isChild
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {student.fullName} will be transferred to <strong>{destClassroom.name}</strong>. Their historical assessment results and reading data will remain intact.
              </span>
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
              type="submit"
              disabled={loading || !selectedClassroomId || selectedClassroomId === student.classroomId}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Confirm Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
