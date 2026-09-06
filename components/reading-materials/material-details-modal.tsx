'use client';

import React from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Edit3,
  Archive,
  RotateCcw,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// READING MATERIAL DETAILS MODAL COMPONENT (MODULE 6)
// ============================================================================
// What this component does:
// Renders a comprehensive preview card for an individual reading passage:
// - Title, grade level, difficulty level, and status badge.
// - Full readable reference passage text for oral reading assessment review.
// - Quick action shortcuts for Editing and Archiving / Restoring.
//
// The displayed passage is the "reference passage" that will be compared
// against a reader's live transcript in future assessment sessions.
//
// Dual Theme Support:
// High-contrast rendering for both 'teacher' (dark slate) and 'child' (light) themes.
// ============================================================================

// Shared type definition used across all reading material components.
export interface ReadingMaterialItem {
  id: string;
  teacherId: string;
  title: string;
  description?: string | null;
  type: string; // Always 'Passage' (retained for backward compatibility)
  content: string;
  wordCount: number;
  difficulty: 'Easy' | 'Moderate' | 'Difficult';
  gradeLevel: string;
  status: 'Active' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

interface MaterialDetailsModalProps {
  material: ReadingMaterialItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (material: ReadingMaterialItem) => void;
  onArchive: (material: ReadingMaterialItem) => void;
}

export function MaterialDetailsModal({
  material,
  isOpen,
  onClose,
  onEdit,
  onArchive,
}: MaterialDetailsModalProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  if (!isOpen || !material) return null;

  // Format creation and update timestamps
  const formattedDate = new Date(material.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(material.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isArchived = material.status === 'Archived';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border transition-all my-8 overflow-hidden ${
          isChild
            ? 'bg-white border-teal-200 text-slate-900'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* ------------------------------------------------------------------ */}
        {/* Header */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={`flex items-start justify-between p-6 border-b ${
            isChild ? 'border-teal-100 bg-teal-50/50' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Reading passage icon */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0 ${
                isChild
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-500/20 text-teal-400'
              }`}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              {/* Metadata badges: grade level, difficulty, status */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isChild
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  }`}
                >
                  {material.gradeLevel}
                </span>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    material.difficulty === 'Easy'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : material.difficulty === 'Moderate'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {material.difficulty}
                </span>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isArchived
                      ? isChild
                        ? 'bg-slate-100 text-slate-600 border-slate-300'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                      : isChild
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {material.status}
                </span>
              </div>

              <h3 className={`text-lg font-black tracking-tight ${isChild ? 'text-teal-950' : 'text-white'}`}>
                {material.title}
              </h3>
              {material.description && (
                <p className={`text-xs mt-1 ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                  {material.description}
                </p>
              )}
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

        {/* ------------------------------------------------------------------ */}
        {/* Modal Body */}
        {/* ------------------------------------------------------------------ */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Word Count — total reference words for reading assessment */}
            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isChild ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Reference Words
              </p>
              <p className={`text-xl font-black mt-1 ${isChild ? 'text-teal-800' : 'text-teal-400'}`}>
                {material.wordCount}
              </p>
            </div>

            {/* Grade Level */}
            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isChild ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Grade Level
              </p>
              <p className={`text-sm font-bold mt-1.5 ${isChild ? 'text-slate-800' : 'text-white'}`}>
                {material.gradeLevel}
              </p>
            </div>

            {/* Difficulty */}
            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isChild ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Difficulty
              </p>
              <p className={`text-sm font-bold mt-1.5 ${isChild ? 'text-slate-800' : 'text-white'}`}>
                {material.difficulty}
              </p>
            </div>

            {/* Created Date */}
            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isChild ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Added
              </p>
              <p className={`text-xs font-bold mt-1.5 truncate ${isChild ? 'text-slate-800' : 'text-slate-300'}`}>
                {formattedDate}
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Reference Passage Content Viewer */}
          {/* ---------------------------------------------------------------- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isChild ? 'text-slate-700' : 'text-slate-300'}`}>
                Reference Passage
              </h4>
              <span className={`text-[11px] ${isChild ? 'text-slate-600' : 'text-slate-400'}`}>
                Full text for oral reading assessment
              </span>
            </div>

            {/* Reading Passage Continuous Typography */}
            <div
              className={`p-5 rounded-2xl border text-base leading-loose whitespace-pre-line font-normal ${
                isChild
                  ? 'bg-slate-50/70 border-slate-200 text-slate-800 font-sans'
                  : 'bg-slate-950/60 border-slate-800 text-slate-100 font-sans'
              }`}
            >
              {material.content}
            </div>
          </div>

          {/* Creation Timestamp Note */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Created on {formattedDate} at {formattedTime}</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Modal Footer Actions */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={`flex items-center justify-between p-4 border-t ${
            isChild ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          {/* Archive / Restore Button */}
          <button
            type="button"
            onClick={() => onArchive(material)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isArchived
                ? isChild
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : isChild
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {isArchived ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore to Active</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Passage</span>
              </>
            )}
          </button>

          {/* Edit & Close Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(material)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isChild
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-2xs'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-400" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
