# Child-Friendly UI & Dual Theme Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Dual-Theme System (Teacher Mode vs Child-Friendly Mode) across all authentication pages and the dashboard with soft pastel styling, extra-large accessible typography, rounded cards, micro-interactions, and a persistent theme switcher.

**Architecture:** A client-side React Theme Provider (`lib/theme-context.tsx`) wraps the app layout (`app/layout.tsx`) and persists theme state in `localStorage`. CSS variables in `app/globals.css` respond to `data-theme="child"` vs `data-theme="teacher"`. A reusable `ThemeToggle` pill component is placed in headers and footers.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React icons.

## Global Constraints
- Target audience for Child Mode: Grade 3 students & teachers.
- Default theme: `teacher` (stored in `localStorage` key `capstone_ui_theme`).
- Child Mode style: Soft cream/sky background, warm teal/gold accents, `rounded-3xl` cards, minimum 48px target heights, friendly high-legibility typography.
- Zero server-side auth logic changes (preserve existing bcrypt, JWT cookie, and middleware behavior).

---

### Task 1: Theme Context Provider & CSS Design Tokens

**Files:**
- Create: `lib/theme-context.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `useTheme()` hook returning `{ theme: 'teacher' | 'child', toggleTheme: () => void, setTheme: (t: 'teacher' | 'child') => void }`

- [ ] **Step 1: Create `lib/theme-context.tsx`**

```tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'teacher' | 'child';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('teacher');

  useEffect(() => {
    const saved = localStorage.getItem('capstone_ui_theme') as Theme;
    if (saved === 'child' || saved === 'teacher') {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'teacher');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('capstone_ui_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'teacher' ? 'child' : 'teacher';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 2: Update `app/globals.css` with Child Mode variables & keyframes**

```css
@import "tailwindcss";

:root {
  --bg-main: #020617;
  --card-bg: #0f172a;
  --text-main: #f8fafc;
  --accent-color: #0d9488;
  --radius-card: 1.5rem;
}

[data-theme="child"] {
  --bg-main: #f0fdf4;
  --card-bg: #ffffff;
  --text-main: #0f172a;
  --accent-color: #0d9488;
  --radius-card: 2rem;
}

body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 3: Update `app/layout.tsx` to wrap children in `ThemeProvider`**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grade 3 Reading Assessment',
  description: 'Assessment and Teacher Management Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="teacher" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-teal-500 selection:text-white`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: Build passes with no TypeScript or layout errors.

- [ ] **Step 5: Commit**

```bash
git add lib/theme-context.tsx app/globals.css app/layout.tsx
git commit -m "feat: implement ThemeProvider and CSS data-theme architecture"
```

---

### Task 2: Reusable Theme Switcher Component (`components/theme-toggle.tsx`)

**Files:**
- Create: `components/theme-toggle.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `lib/theme-context.tsx`
- Produces: `<ThemeToggle />` button component

- [ ] **Step 1: Create `components/theme-toggle.tsx`**

```tsx
'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { Sparkles, School, Heart } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-semibold text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md border ${
        theme === 'child'
          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
          : 'bg-slate-800 text-teal-300 border-slate-700 hover:bg-slate-700'
      }`}
      title="Toggle UI Theme Mode"
      aria-label="Toggle UI Theme Mode"
    >
      {theme === 'child' ? (
        <>
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Child Mode 🌟</span>
        </>
      ) : (
        <>
          <School className="w-4 h-4 text-teal-400" />
          <span>Teacher Mode 🎓</span>
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Successful compilation without errors.

- [ ] **Step 3: Commit**

```bash
git add components/theme-toggle.tsx
git commit -m "feat: add ThemeToggle component"
```

---

### Task 3: Child-Friendly Adaptive Auth Pages

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `app/register/page.tsx`
- Modify: `app/forgot-password/page.tsx`
- Modify: `app/reset-password/page.tsx`

**Interfaces:**
- Consumes: `useTheme()` and `<ThemeToggle />`

- [ ] **Step 1: Update `app/login/page.tsx`**
Add `<ThemeToggle />` at the top or footer, and apply dynamic child-friendly container classes (`bg-amber-50/50` / soft pastel cards / extra rounded input inputs with `rounded-2xl` and min 48px height when `theme === 'child'`).

- [ ] **Step 2: Update `app/register/page.tsx`**
Integrate `useTheme()` and `<ThemeToggle />`, scaling text and buttons for child-friendly accessibility.

- [ ] **Step 3: Update `app/forgot-password/page.tsx` and `app/reset-password/page.tsx`**
Ensure password reset flow pages support theme toggling and child-friendly soft cards.

- [ ] **Step 4: Build verification**

Run: `npm run build`
Expected: Build passes successfully.

- [ ] **Step 5: Commit**

```bash
git add app/login/page.tsx app/register/page.tsx app/forgot-password/page.tsx app/reset-password/page.tsx
git commit -m "feat: enhance auth pages with child-friendly adaptive layouts and ThemeToggle"
```

---

### Task 4: Child-Friendly Adaptive Dashboard (`app/dashboard/page.tsx`)

**Files:**
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useTheme()` and `<ThemeToggle />`

- [ ] **Step 1: Add ThemeToggle and Child-Friendly Card Styling to `app/dashboard/page.tsx`**
Update header bar to render `<ThemeToggle />`.
When `theme === 'child'`:
- Banner displays a warm, encouraging reading message with soft pastel yellow/mint colors ("Ready for Grade 3 Reading! 📖✨").
- Quick navigation and status cards feature bright rounded badges (`rounded-3xl`), friendly icons, and large touch targets.

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Pass without lint or type errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: adapt dashboard with child-friendly reading cards and theme switcher"
```
