'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  X,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit3,
  GraduationCap,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { ReadingMaterialItem } from './material-details-modal';

// ============================================================================
// EDIT READING PASSAGE MODAL COMPONENT (MODULE 6)
// ============================================================================
// What this component does:
// Allows teachers to update an existing reading passage:
// - Pre-populates all existing data (title, description, grade level, difficulty, content).
// - Provides real-time word counting as content is edited.
// - Grade level can be changed (Grade 1 through Grade 6).
// - Enforces validation before saving updates via PUT /api/reading-materials/[id].
//
// The updated passage continues to serve as the "reference passage" for future
// reading assessments. Its word count is recalculated in real-time.
// ============================================================================

// Available grade levels for the reading passage
const GRADE_LEVELS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
];

interface EditMaterialModalProps {
  material: ReadingMaterialItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditMaterialModal({
  material,
  isOpen,
  onClose,
  onUpdated,
}: EditMaterialModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 3');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Difficult'>('Easy');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form inputs with selected material whenever modal opens
  useEffect(() => {
    if (material) {
      setTitle(material.title);
      setDescription(material.description || '');
      setContent(material.content);
      setGradeLevel(material.gradeLevel || 'Grade 3');
      setDifficulty(material.difficulty);
      setErrorMessage(null);
    }
  }, [material, isOpen]);

  // Live Word Count Recalculation
  // Uses passage word counting: split on whitespace, strip punctuation, count valid tokens.
  const stats = useMemo(() => {
    const tokens = content.trim().split(/\s+/).filter(Boolean);
    const words = tokens.filter((token) => {
      const cleaned = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      return cleaned.length > 0;
    });
    return {
      wordCount: content.trim().length === 0 ? 0 : words.length,
      charCount: content.length,
    };
  }, [content]);

  if (!isOpen || !material) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Passage title cannot be empty.');
      return;
    }

    if (title.trim().length < 2) {
      setErrorMessage('Title must be at least 2 characters long.');
      return;
    }

    if (!content.trim() || stats.wordCount === 0) {
      setErrorMessage('Reading passage must contain at least one readable word.');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.put(`/api/reading-materials/${material.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        content: content.trim(),
        difficulty,
        gradeLevel,
      });

      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating reading passage:', err);
      setErrorMessage(
        err?.response?.data?.error ||
          'Failed to update reading passage. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border transition-all my-8 overflow-hidden ${
          isChild
            ? 'bg-white border-teal-200 text-slate-900'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isChild ? 'border-teal-100 bg-teal-50/50' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-black tracking-tight ${isChild ? 'text-teal-950' : 'text-white'}`}>
                Edit Reading Passage
              </h3>
              <p className={`text-xs ${isChild ? 'text-teal-700' : 'text-slate-400'}`}>
                Update content, word counts, and classification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isChild ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-2xl text-xs border animate-fadeIn ${
                isChild
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label
              htmlFor="edit-material-title"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-material-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-white border-slate-200 focus:ring-teal-400 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-white'
              }`}
            />
          </div>

          {/* Grade Level & Difficulty Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grade Level Dropdown */}
            <div>
              <label
                htmlFor="edit-grade-select"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Grade Level <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                  isChild ? 'text-teal-600' : 'text-teal-400'
                }`} />
                <select
                  id="edit-grade-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-semibold transition-all focus:outline-none focus:ring-2 appearance-none ${
                    isChild
                      ? 'bg-white border-slate-200 focus:ring-teal-400 text-slate-800'
                      : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-slate-200'
                  }`}
                >
                  {GRADE_LEVELS.map((gl) => (
                    <option key={gl} value={gl}>{gl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Difficulty Level Selector */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Difficulty Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Moderate', 'Difficult'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? lvl === 'Easy'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                          : lvl === 'Moderate'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                          : 'bg-rose-500/15 border-rose-500 text-rose-400'
                        : isChild
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit-material-desc"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isChild ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Description / Notes (Optional)
            </label>
            <input
              id="edit-material-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 ${
                isChild
                  ? 'bg-white border-slate-200 focus:ring-teal-400 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-white'
              }`}
            />
          </div>

          {/* Content Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-material-content"
                className={`block text-xs font-semibold uppercase tracking-wider ${
                  isChild ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Reading Passage <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                    stats.wordCount > 0
                      ? isChild
                        ? 'bg-teal-100 text-teal-800 border-teal-200'
                        : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                      : isChild
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {stats.wordCount} Words
                </span>
              </div>
            </div>

            <textarea
              id="edit-material-content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full p-4 rounded-2xl border text-sm font-normal leading-relaxed transition-all focus:outline-none focus:ring-2 resize-y ${
                isChild
                  ? 'bg-white border-slate-200 focus:ring-teal-400 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:ring-teal-500 text-white'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div
            className={`flex items-center justify-end gap-3 pt-4 border-t ${
              isChild ? 'border-slate-200' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isChild
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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
