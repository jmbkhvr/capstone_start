'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// DASHBOARD SUMMARY CARD COMPONENT
// ============================================================================
// What this component does:
// Renders an individual KPI summary card on the Teacher Dashboard:
// - Displays title, metric value (number), status subtitle, and icon.
// - Supports empty-state indicators when data has not yet been recorded.
// - Supports both 'teacher' (dark slate/teal) and 'child' (light emerald/amber) themes.
//
// Compliance:
// Complies with Section 6 & 15: Displays real counts, clearly indicating when data
// is at zero/baseline rather than displaying fake performance data.
// ============================================================================

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  emptyHint?: string;
  badgeText?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  emptyHint,
  badgeText,
}: SummaryCardProps) {
  const { theme } = useTheme();
  const isChild = theme === 'child';

  const isEmpty = value === 0;

  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-300 border relative overflow-hidden group shadow-md hover:shadow-lg ${
        isChild
          ? 'bg-white border-teal-200/80 hover:-translate-y-0.5'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top row: Icon and optional badge */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${iconBgClass} ${iconColorClass}`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {badgeText && (
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
              isChild
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="space-y-1">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            isChild ? 'text-teal-800' : 'text-slate-400'
          }`}
        >
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isChild ? 'text-teal-950' : 'text-white'
            }`}
          >
            {value}
          </h3>
          {isEmpty && (
            <span
              className={`text-[11px] font-semibold ${
                isChild ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              (No records yet)
            </span>
          )}
        </div>
      </div>

      {/* Subtitle / Context note */}
      <p
        className={`text-xs mt-3 leading-relaxed ${
          isChild ? 'text-slate-600 font-medium' : 'text-slate-400'
        }`}
      >
        {isEmpty && emptyHint ? emptyHint : subtitle}
      </p>

      {/* Visual Accent bar at the bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${
          isEmpty
            ? 'bg-slate-700/20'
            : isChild
            ? 'bg-teal-500 group-hover:h-1.5'
            : 'bg-teal-500/60 group-hover:h-1.5'
        }`}
      />
    </div>
  );
}
