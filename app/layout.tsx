import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Initialize Inter font for clean, modern legibility.
const inter = Inter({ subsets: ['latin'] });

// ============================================================================
// ROOT APPLICATION LAYOUT
// ============================================================================
// What this file does:
// Serves as the top-level HTML wrapper for all pages in the Next.js application.
// Configures system metadata, responsive viewport settings, global CSS styles,
// and font typography.
// ============================================================================

export const metadata: Metadata = {
  title: 'Teacher Portal | Grade 3 Reading Assessment System',
  description:
    'Web-Based Reading Proficiency Assessment System with Automated Pronunciation Scoring Platform for Grade 3 Pupils',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className={`${inter.className} min-h-full flex flex-col font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
