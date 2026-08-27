import { redirect } from 'next/navigation';
import { getAuthenticatedTeacher } from '@/lib/auth';

// ============================================================================
// ROOT LANDING PAGE (AUTOMATIC AUTHENTICATION REDIRECT)
// ============================================================================
// What this component does:
// Serves as the index entry point for the application.
// It checks if a teacher is currently logged in:
// - If logged in -> Redirects immediately to /dashboard.
// - If logged out -> Redirects immediately to /login.
//
// Why it is needed:
// Ensures visitors landing at the root domain URL are automatically guided
// to the appropriate authentication state without dead links.
// ============================================================================

export default async function HomePage() {
  // Check authenticated teacher session from cookies.
  const teacher = await getAuthenticatedTeacher();

  if (teacher) {
    // Authenticated teacher -> redirect to protected dashboard.
    redirect('/dashboard');
  } else {
    // Unauthenticated user -> redirect to teacher login.
    redirect('/login');
  }
}
