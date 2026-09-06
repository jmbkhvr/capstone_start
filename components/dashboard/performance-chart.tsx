'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// STUDENT PERFORMANCE OVERVIEW CHART COMPONENT (RECHARTS)
// ============================================================================
// What this component does:
// Renders the performance overview visualization using Recharts (Plan A):
// - Tracks the core Grade 3 reading dimensions:
//   1. Reading Accuracy
//   2. Pronunciation Performance
//   3. Reading Fluency
//   4. Overall Performance
// - Complies with Section 8: Displays stored results when available without
//   inventing speech recognition calculations or fabricating fake pupil data.
// - Provides a clean, informative state when no assessments have been logged yet.
// ============================================================================

export interface PerformanceCategoryData {
  category: string;
  score: number;
  benchmark: number;
}

interface PerformanceChartProps {
  data: PerformanceCategoryData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // Check if real performance records exist
  const hasData = data && data.length > 0 && data.some((d) => d.score > 0);

  // Default baseline categories according to Section 8 specifications
  const displayData: PerformanceCategoryData[] = hasData
    ? data
    : [
        { category: 'Reading Accuracy', score: 0, benchmark: 85 },
        { category: 'Pronunciation', score: 0, benchmark: 80 },
        { category: 'Reading Fluency', score: 0, benchmark: 90 },
        { category: 'Overall Performance', score: 0, benchmark: 85 },
      ];

  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-300 border shadow-md flex flex-col justify-between ${
        isChild ? 'bg-white border-teal-200/80' : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={`text-lg font-extrabold tracking-tight ${
                isChild ? 'text-teal-950' : 'text-white'
              }`}
            >
              Student Performance Overview
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isChild
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
              }`}
            >
              Phil-IRI Standard
            </span>
          </div>
          <p
            className={`text-xs mt-0.5 ${
              isChild ? 'text-teal-800 font-medium' : 'text-slate-400'
            }`}
          >
            Average pupil performance across key oral reading dimensions
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              isChild
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            Target: 80%+
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Chart Canvas Area                                                    */}
      {/* -------------------------------------------------------------------- */}
      <div className="w-full h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isChild ? '#e2e8f0' : '#1e293b'}
              vertical={false}
            />
            <XAxis
              dataKey="category"
              tick={{
                fill: isChild ? '#475569' : '#94a3b8',
                fontSize: 11,
                fontWeight: 600,
              }}
              axisLine={{ stroke: isChild ? '#cbd5e1' : '#334155' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{
                fill: isChild ? '#475569' : '#94a3b8',
                fontSize: 11,
              }}
              axisLine={{ stroke: isChild ? '#cbd5e1' : '#334155' }}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isChild ? '#ffffff' : '#0f172a',
                borderColor: isChild ? '#99f6e4' : '#334155',
                borderRadius: '16px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                color: isChild ? '#0f172a' : '#f8fafc',
              }}
              formatter={(val: any) => [`${val}%`, 'Score']}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => (
                <span className={isChild ? 'text-slate-700 font-semibold' : 'text-slate-300'}>
                  {value}
                </span>
              )}
            />
            <Bar
              name="Class Average"
              dataKey="score"
              fill={isChild ? '#0d9488' : '#14b8a6'}
              radius={[8, 8, 0, 0]}
              maxBarSize={45}
            />
            <Bar
              name="DepEd Benchmark"
              dataKey="benchmark"
              fill={isChild ? '#cbd5e1' : '#334155'}
              radius={[8, 8, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Informative overlay banner when 0 assessment data has been recorded */}
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[1px] rounded-2xl p-4 text-center">
            <div
              className={`p-4 rounded-2xl border max-w-sm shadow-xl ${
                isChild
                  ? 'bg-white/95 border-teal-200 text-slate-800'
                  : 'bg-slate-900/95 border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2 text-teal-400 font-bold text-xs">
                <BarChart3 className="w-4 h-4" />
                <span>Performance Metrics Baseline</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Class averages will dynamically render here once pupils complete automated
                pronunciation and reading evaluations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div
        className={`mt-4 pt-3 border-t text-[11px] flex items-center justify-between ${
          isChild
            ? 'border-teal-100 text-slate-500'
            : 'border-slate-800/80 text-slate-500'
        }`}
      >
        <span>DepEd Grade 3 Oral Reading Diagnostic Standards</span>
        <span>{hasData ? 'Active Assessment Data' : 'Awaiting Assessments'}</span>
      </div>
    </div>
  );
}
