# Design Specification: Child-Friendly UI & Dual Theme Engine

**Date**: August 27, 2026  
**Status**: Approved  
**Topic**: Child-Friendly UI & Dual Theme System for Grade 3 Reading Assessment  

---

## 1. Overview & Objectives

The goal of this feature is to enhance the Grade 3 Reading Assessment web application with an accessible, engaging, and child-friendly aesthetic while preserving the professional workspace for teachers.

We introduce a **Dual-Theme Engine** featuring:
1. **Teacher Mode**: Professional, sleek dark-slate interface for classroom management.
2. **Child-Friendly Mode**: Soft pastel cream & teal palette, extra-large high-legibility typography, friendly rounded card shapes, large tap/click targets, and playful micro-interactions.

---

## 2. Architecture & Design Tokens

### Theme Provider (`components/theme-provider.tsx`)
- Client-side React Context (`ThemeProvider`) wrapping the root layout (`app/layout.tsx`).
- Stores theme preference (`'teacher' | 'child'`) in `localStorage` under `capstone_ui_theme`.
- Automatically syncs `data-theme="teacher"` or `data-theme="child"` onto the `<html>` root node.

### Theme Toggle (`components/theme-toggle.tsx`)
- Interactive, accessible pill switch placed in header navigation bars and auth page footers.
- Visual badges:
  - Teacher Mode: Briefcase / Graduation Cap icon.
  - Child Mode: Smiling Book / Sparkle Star icon with soft pastel badge.

### CSS Design Tokens (`app/globals.css`)
- Custom CSS variables responding to `data-theme="child"` vs `data-theme="teacher"`.
- Smooth 300ms transition duration for theme switches.
- Child mode overrides:
  - Background: Soft cream tint (`#f8fafc` / `#f0fdfa`)
  - Accent colors: Warm Teal (`#0d9488`), Sunny Gold (`#f59e0b`), Soft Rose (`#f43f5e`)
  - Border radius: `rounded-3xl` for cards, `rounded-2xl` / `rounded-full` for inputs and buttons
  - Target sizing: Minimum 48px height for all interactive elements.

---

## 3. UI Component Adaptations

### Auth Pages (`/login`, `/register`, `/forgot-password`, `/reset-password`)
- Dynamic background with subtle decorative floating stars/sparkles in Child Mode.
- Large input fields with bold, high-contrast labels and soft focus rings.
- Prominent rounded primary action buttons with subtle lift effect on hover (`hover:-translate-y-0.5`).
- Friendly encouraging header subtitles.

### Dashboard (`/dashboard`)
- Adaptive header with logo, system title, profile badge, and Theme Toggle widget.
- Soft pastel welcome banner for Child Mode with encouraging greeting ("Ready to read today? 📚✨").
- Quick navigation & system assessment status cards styled with colorful soft pastel background badges.

---

## 4. Verification & Testing

1. **Theme Switch Verification**: Toggle between Teacher and Child modes; ensure all pages immediately update without full page reloads.
2. **Persistence**: Reload browser window; ensure active theme choice persists via `localStorage`.
3. **Accessibility**: Verify input focus states, touch target heights (>= 48px), and contrast levels in Child Mode.
