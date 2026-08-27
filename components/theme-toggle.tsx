'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { Sparkles, School } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isChild = theme === 'child';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-xs transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md cursor-pointer border ${
        isChild
          ? 'bg-amber-200/90 text-amber-950 border-amber-300 hover:bg-amber-300 shadow-amber-200/50'
          : 'bg-slate-800/90 text-teal-300 border-slate-700 hover:bg-slate-700 hover:text-teal-200 shadow-slate-900/50'
      } ${className}`}
      title={isChild ? 'Switch to Teacher Mode' : 'Switch to Child-Friendly Reading Mode'}
      aria-label={isChild ? 'Switch to Teacher Mode' : 'Switch to Child-Friendly Reading Mode'}
    >
      {isChild ? (
        <>
          <Sparkles className="w-4 h-4 text-amber-600 animate-bounceSlow" />
          <span>{compact ? 'Child Mode' : 'Child Mode 🌟'}</span>
        </>
      ) : (
        <>
          <School className="w-4 h-4 text-teal-400" />
          <span>{compact ? 'Teacher Mode' : 'Teacher Mode 🎓'}</span>
        </>
      )}
    </button>
  );
}
