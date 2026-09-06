'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Edit3,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  Save,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import type { ClassroomRecord } from './create-classroom-modal';

// ============================================================================
// EDIT CLASSROOM MODAL COMPONENT (MODULE 4)
// ============================================================================
// What this component does:
// 1. Pre-populates the modal form with the selected classroom's current data.
// 2. Validates user input for updated classroom name, grade level, section,
//    school year, and notes.
// 3. Sends a PUT request to /api/classrooms/:id.
// 4. Updates the parent list upon successful server response.
// ============================================================================

interface EditClassroomModalProps {
  isOpen: boolean;
  classroom: ClassroomRecord | null;
  onClose: () => void;
  onSuccess: (updatedClassroom: ClassroomRecord) => void;
}

export function EditClassroomModal({
  isOpen,
  classroom,
  onClose,
  onSuccess,
}: EditClassroomModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // Form State Management
  // --------------------------------------------------------------------------
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 3');
  const [section, setSection] = useState('');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [description, setDescription] = useState('');

  // UI state for loading and error alerts
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Sync form state whenever selected classroom changes or modal opens
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (classroom) {
      setName(classroom.name || '');
      setGradeLevel(classroom.gradeLevel || 'Grade 3');
      setSection(classroom.section || '');
      setSchoolYear(classroom.schoolYear || '2026-2027');
      setDescription(classroom.description || '');
      setErrorMessage(null);
    }
  }, [classroom, isOpen]);

  // If modal is not open or no classroom selected, render nothing
  if (!isOpen || !classroom) return null;

  // --------------------------------------------------------------------------
  // Handle Modal Close
  // --------------------------------------------------------------------------
  const handleClose = () => {
    if (loading) return;
    setErrorMessage(null);
    onClose();
  };

  // --------------------------------------------------------------------------
  // Handle Form Submission
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Classroom Name
    if (!name.trim()) {
      setErrorMessage('Please enter a classroom name.');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage('Classroom name must be at least 2 characters.');
      return;
    }

    // Validate School Year
    if (!schoolYear.trim()) {
      setErrorMessage('Please specify the school year (e.g. 2026-2027).');
      return;
    }

    try {
      setLoading(true);

      // Send PUT request to update classroom
      const response = await axios.put(`/api/classrooms/${classroom.id}`, {
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        section: section.trim() || undefined,
        schoolYear: schoolYear.trim(),
        description: description.trim() || undefined,
      });

      // Notify parent page of updated classroom
      onSuccess(response.data.classroom);
      onClose();
    } catch (err: any) {
      console.error('Failed to update classroom:', err);
      const msg =
        err.response?.data?.error ||
        'An unexpected error occurred while updating the classroom. Please try again.';
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
      aria-labelledby="edit-classroom-title"
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
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}
            >
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="edit-classroom-title"
                className="text-lg font-bold tracking-tight"
              >
                Edit Classroom Information
              </h2>
              <p
                className={`text-xs ${
                  isChild ? 'text-amber-800/70' : 'text-slate-400'
                }`}
              >
                Update classroom name, section, school year, or description
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
                ? 'text-slate-400 hover:text-slate-600 hover:bg-amber-100/50'
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
            <div className="flex items-start gap-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Classroom Name Input */}
          <div>
            <label
              htmlFor="edit-classroom-name-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Classroom Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-classroom-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grade 3 - Section Diamond"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 focus:ring-blue-500 text-slate-100'
              }`}
            />
          </div>

          {/* Grid: Grade Level & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grade Level Select */}
            <div>
              <label
                htmlFor="edit-classroom-grade-select"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Grade Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="edit-classroom-grade-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 appearance-none ${
                    isChild
                      ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-blue-500 text-slate-100'
                  }`}
                >
                  <option value="Grade 3">Grade 3 (Target Level)</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 4">Grade 4</option>
                </select>
                <Layers className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Section Name */}
            <div>
              <label
                htmlFor="edit-classroom-section-input"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Section (Optional)
              </label>
              <input
                id="edit-classroom-section-input"
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Diamond, Mabini"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-blue-500 text-slate-100'
                }`}
              />
            </div>
          </div>

          {/* School Year Field */}
          <div>
            <label
              htmlFor="edit-classroom-sy-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              School Year <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="edit-classroom-sy-input"
                type="text"
                required
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="e.g. 2026-2027"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-blue-500 text-slate-100'
                }`}
              />
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="edit-classroom-desc-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Description / Notes (Optional)
            </label>
            <textarea
              id="edit-classroom-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any specific classroom schedule or notes..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
                isChild
                  ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800'
                  : 'bg-slate-800/80 border-slate-700 focus:ring-blue-500 text-slate-100'
              }`}
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800">
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
              id="submit-edit-classroom-btn"
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                isChild
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
