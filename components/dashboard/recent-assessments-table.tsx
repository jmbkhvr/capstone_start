'use client';

import React from 'react';
import { FileText, Calendar, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// RECENT ASSESSMENTS TABLE COMPONENT
// ============================================================================
// What this component does:
// Renders the Recent Assessments section of the Teacher Dashboard:
// - Shows Student Name, Assessment Title, Date, Score, and Status.
// - Complies with Section 7 & 15: Displays real database rows when available,
//   and presents a clear, polite empty state when no assessments have occurred yet.
// - Supports both 'teacher' and 'child' theme styling.
// ============================================================================

export interface AssessmentItem {
  id: string;
  studentName: string;
  assessmentName: string;
  date: string;
  score: number | null;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Needs Review';
}

interface RecentAssessmentsTableProps {
  assessments: AssessmentItem[];
}

export function RecentAssessmentsTable({ assessments }: RecentAssessmentsTableProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // --------------------------------------------------------------------------
  // Helper to render colored badge based on assessment status
  // --------------------------------------------------------------------------
  const renderStatusBadge = (status: AssessmentItem['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isChild
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isChild
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <Clock className="w-3 h-3 animate-spin" />
            In Progress
          </span>
        );
      case 'Needs Review':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isChild
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Needs Review
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isChild
                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-300 border shadow-md ${
        isChild ? 'bg-white border-teal-200/80' : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className={`text-lg font-extrabold tracking-tight ${
              isChild ? 'text-teal-950' : 'text-white'
            }`}
          >
            Recent Assessments
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isChild ? 'text-teal-800 font-medium' : 'text-slate-400'
            }`}
          >
            Latest oral reading tests and automated pronunciation evaluations
          </p>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            isChild
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {assessments.length} {assessments.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Case 1: Empty State (When no assessments have been recorded yet)     */}
      {/* -------------------------------------------------------------------- */}
      {assessments.length === 0 ? (
        <div
          className={`py-12 px-4 rounded-2xl flex flex-col items-center justify-center text-center border border-dashed ${
            isChild
              ? 'bg-teal-50/40 border-teal-200 text-slate-700'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
              isChild ? 'bg-teal-100 text-teal-700' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <FileText className="w-6 h-6" />
          </div>
          <h4
            className={`text-sm font-bold mb-1 ${
              isChild ? 'text-teal-950' : 'text-slate-200'
            }`}
          >
            No assessments have been recorded yet.
          </h4>
          <p className="text-xs max-w-sm leading-relaxed">
            Assessment logs and pronunciation evaluation results will automatically appear
            here as Grade 3 pupils complete reading sessions.
          </p>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* Case 2: Populated Table of Real Assessment Records                  */
        /* ------------------------------------------------------------------ */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b ${
                  isChild
                    ? 'border-teal-100 text-teal-900'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                <th className="pb-3 font-bold uppercase tracking-wider">Student</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Assessment</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Date</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Score</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isChild ? 'divide-teal-50' : 'divide-slate-800/60'
              }`}
            >
              {assessments.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isChild ? 'hover:bg-teal-50/50' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3.5 font-bold">
                    <span className={isChild ? 'text-slate-900' : 'text-white'}>
                      {item.studentName}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={isChild ? 'text-slate-700' : 'text-slate-300'}>
                      {item.assessmentName}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        isChild ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold">
                    {item.score !== null ? (
                      <span className={isChild ? 'text-teal-800' : 'text-teal-400'}>
                        {item.score}%
                      </span>
                    ) : (
                      <span className={isChild ? 'text-slate-400' : 'text-slate-500'}>
                        --
                      </span>
                    )}
                  </td>
                  <td className="py-3.5">{renderStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
