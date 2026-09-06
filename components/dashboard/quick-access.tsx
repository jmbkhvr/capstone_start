'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, Users, BookOpen, FileCheck2, ArrowRight, Info, X } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ============================================================================
// QUICK ACCESS ACTION PANEL COMPONENT
// ============================================================================
// What this component does:
// Renders the Quick Access shortcuts specified in Section 9:
// - [ Manage Classes ] (Navigates to /classrooms - Module 4)
// - [ Manage Students ]
// - [ Reading Materials ]
// - [ Assessments ]
// ============================================================================

interface QuickAction {
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href?: string;
}

export function QuickAccess() {
  const router = useRouter();
  const { theme } = useTheme();
  const isChild = theme === 'child';

  // State to track which action item modal notice is currently shown
  const [activeNotice, setActiveNotice] = useState<QuickAction | null>(null);

  // List of four standard quick action buttons
  const actions: QuickAction[] = [
    {
      title: 'Manage Classes',
      badge: 'Active',
      href: '/classrooms',
      description:
        'Create classroom sections, view assigned pupils, and configure academic term schedules.',
      icon: School,
      iconBg: isChild ? 'bg-amber-100' : 'bg-amber-500/10',
      iconColor: isChild ? 'text-amber-700' : 'text-amber-400',
    },
    {
      title: 'Manage Students',
      badge: 'Active',
      href: '/students',
      description:
        'Register pupils, manage enrollment profiles, and track reading proficiency classifications.',
      icon: Users,
      iconBg: isChild ? 'bg-sky-100' : 'bg-sky-500/10',
      iconColor: isChild ? 'text-sky-700' : 'text-sky-400',
    },
    {
      title: 'Reading Materials',
      badge: 'Active',
      href: '/reading-materials',
      description:
        'Browse graded reading passages for oral reading assessments across multiple grade levels.',
      icon: BookOpen,
      iconBg: isChild ? 'bg-emerald-100' : 'bg-emerald-500/10',
      iconColor: isChild ? 'text-emerald-700' : 'text-emerald-400',
    },
    {
      title: 'Assessments',
      badge: 'Soon',
      description:
        'Launch speech-recognition oral assessments, evaluate pronunciation accuracy, and track reading speeds.',
      icon: FileCheck2,
      iconBg: isChild ? 'bg-purple-100' : 'bg-purple-500/10',
      iconColor: isChild ? 'text-purple-700' : 'text-purple-400',
    },
  ];

  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-300 border shadow-md ${
        isChild ? 'bg-white border-teal-200/80' : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3
            className={`text-lg font-extrabold tracking-tight ${
              isChild ? 'text-teal-950' : 'text-white'
            }`}
          >
            Quick Access
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isChild ? 'text-teal-800 font-medium' : 'text-slate-400'
            }`}
          >
            Direct shortcuts to core teacher management tools
          </p>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            isChild
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          Teacher Workflows
        </span>
      </div>

      {/* Grid of Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => {
                if (action.href) {
                  router.push(action.href);
                } else {
                  setActiveNotice(action);
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 group flex flex-col justify-between hover:shadow-md cursor-pointer ${
                isChild
                  ? 'bg-slate-50/80 hover:bg-teal-50/60 border-slate-200 hover:border-teal-300'
                  : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 hover:border-teal-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${action.iconBg} ${action.iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      action.badge === 'Active'
                        ? isChild
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isChild
                        ? 'bg-slate-200/80 text-slate-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {action.badge}
                  </span>
                </div>

                <h4
                  className={`text-sm font-bold tracking-tight mb-1 ${
                    isChild ? 'text-slate-900 group-hover:text-teal-900' : 'text-slate-200 group-hover:text-white'
                  }`}
                >
                  {action.title}
                </h4>

                <p
                  className={`text-xs leading-relaxed line-clamp-2 ${
                    isChild ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {action.description}
                </p>
              </div>

              <div
                className={`mt-4 pt-2 border-t flex items-center justify-between text-xs font-semibold ${
                  isChild
                    ? 'border-slate-200/60 text-teal-700 group-hover:text-teal-800'
                    : 'border-slate-800/80 text-teal-400 group-hover:text-teal-300'
                }`}
              >
                <span>{action.href ? 'Launch Tool' : 'Coming Soon'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Informative Modal Notice for Upcoming Features                      */}
      {/* -------------------------------------------------------------------- */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              isChild
                ? 'bg-white border-teal-200 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${activeNotice.iconBg} ${activeNotice.iconColor}`}
                >
                  <activeNotice.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">{activeNotice.title}</h3>
                  <p className="text-xs text-teal-400 font-semibold">Upcoming Feature</p>
                </div>
              </div>
              <button
                onClick={() => setActiveNotice(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {activeNotice.description}
              <br />
              <br />
              This feature is currently in active development for{' '}
              <strong className="text-teal-400">{activeNotice.title}</strong> and will be available in an upcoming update.
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveNotice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
