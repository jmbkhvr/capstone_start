'use client';

import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  School,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { SUPPORTED_GRADE_LEVELS } from '@/lib/constants';

// ============================================================================
// CLASSROOM RECORD TYPE DEFINITION
// ============================================================================
// Defines the TypeScript data shape for a classroom record across the client UI.
export interface ClassroomRecord {
  id: string;
  name: string;
  gradeLevel: string;
  section: string | null;
  schoolYear: string;
  description: string | null;
  teacherId: string;
  status: 'Active' | 'Archived';
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  teacherName?: string;
}

// Props passed into the CreateClassroomModal component
interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClassroom: ClassroomRecord) => void;
}

// ============================================================================
// CREATE CLASSROOM MODAL COMPONENT (MODULE 4)
// ============================================================================
// What this component does:
// 1. Presents a focused, accessible modal form for teachers to create a classroom.
// 2. Captures Classroom Name, Grade Level (Grade 3), Section, School Year, and Description.
// 3. Validates required inputs and handles duplicate classroom errors gracefully.
// 4. Calls POST /api/classrooms and refreshes the parent classroom list upon success.
// ============================================================================

export function CreateClassroomModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClassroomModalProps) {
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

  // UI state for loading spinner and error messages
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If modal is closed, render nothing
  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Reset Form Inputs
  // --------------------------------------------------------------------------
  const resetForm = () => {
    setName('');
    setGradeLevel('Grade 3');
    setSection('');
    setSchoolYear('2026-2027');
    setDescription('');
    setErrorMessage(null);
  };

  // --------------------------------------------------------------------------
  // Handle Modal Close
  // --------------------------------------------------------------------------
  const handleClose = () => {
    if (loading) return; // Prevent closing while request is in flight
    resetForm();
    onClose();
  };

  // --------------------------------------------------------------------------
  // Handle Form Submission
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side field validations
    if (!name.trim()) {
      setErrorMessage('Please enter a classroom name (e.g., "Grade 3 - Section Diamond").');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage('Classroom name must be at least 2 characters.');
      return;
    }

    if (!schoolYear.trim()) {
      setErrorMessage('Please specify the school year (e.g., "2026-2027").');
      return;
    }

    try {
      setLoading(true);

      // Send POST request to backend API
      const response = await axios.post('/api/classrooms', {
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        section: section.trim() || undefined,
        schoolYear: schoolYear.trim(),
        description: description.trim() || undefined,
      });

      // Notify parent page of newly created classroom
      onSuccess(response.data.classroom);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to create classroom:', err);
      const msg =
        err.response?.data?.error ||
        'An unexpected error occurred while creating the classroom. Please try again.';
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
      aria-labelledby="create-classroom-title"
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
                id="create-classroom-title"
                className="text-lg font-bold tracking-tight"
              >
                Create New Classroom
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  isChild ? 'text-amber-800/80' : 'text-slate-400'
                }`}
              >
                Add an academic section to your active classroom roster
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

        {/* Modal Body Form */}
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

          {/* Classroom Name Field */}
          <div>
            <label
              htmlFor="classroom-name-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Classroom Name <span className="text-red-500">*</span>
            </label>
            <input
              id="classroom-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grade 3 - Section Diamond"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800 placeholder-slate-400'
                  : 'bg-slate-800/80 border-slate-700 focus:ring-emerald-500 text-slate-100 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Grid Row: Grade Level & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grade Level Select */}
            <div>
              <label
                htmlFor="classroom-grade-select"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Grade Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="classroom-grade-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 appearance-none ${
                    isChild
                      ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-emerald-500 text-slate-100'
                  }`}
                >
                  {/* Dynamically render all supported elementary grade levels (Grade 1 to 6) */}
                  {SUPPORTED_GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <Layers className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Section Name */}
            <div>
              <label
                htmlFor="classroom-section-input"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Section (Optional)
              </label>
              <input
                id="classroom-section-input"
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Diamond, Mabini"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-emerald-500 text-slate-100 placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* School Year Field */}
          <div>
            <label
              htmlFor="classroom-sy-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              School Year <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="classroom-sy-input"
                type="text"
                required
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="e.g. 2026-2027"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  isChild
                    ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-emerald-500 text-slate-100 placeholder-slate-500'
                }`}
              />
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* Description / Notes Field */}
          <div>
            <label
              htmlFor="classroom-desc-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <textarea
                id="classroom-desc-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any specific classroom schedule or teacher notes..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
                  isChild
                    ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-400 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 focus:ring-emerald-500 text-slate-100 placeholder-slate-500'
                }`}
              />
            </div>
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
              id="submit-create-classroom-btn"
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                isChild
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Classroom</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
