import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// ROUTE PROTECTION MIDDLEWARE
// ============================================================================
// What this file does:
// Intercepts every incoming page request to enforce authentication rules:
// 1. Unauthenticated teachers trying to visit protected pages (/dashboard, /parents, etc.)
//    are automatically redirected to the Login page (/login).
// 2. Already logged-in teachers trying to visit Auth pages (/login, /register)
//    are automatically redirected to their Teacher Dashboard (/dashboard).
//
// Why it is needed:
// Provides server-side route security preventing unauthorized users from accessing
// protected pupil assessment and classroom management pages.
// Security Note:
// Checks for the existence of the 'teacher_auth_token' cookie.
// ============================================================================

// List of protected URL paths requiring an active teacher session.
const PROTECTED_ROUTES = [
  '/dashboard',
  '/parents',
  '/classrooms',
  '/students',
  '/reading-materials',
  '/assessments',
];

// List of authentication URL paths reserved for unauthenticated guests.
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve auth token cookie from request headers.
  const authToken = request.cookies.get('teacher_auth_token')?.value;

  // Check if current requested URL starts with any protected route path.
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current requested URL is an auth route (/login or /register).
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // RULE 1: Redirect unauthenticated users away from protected pages to /login.
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    // Include original requested URL as return query param so user returns after login.
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RULE 2: Redirect logged-in teachers away from login/register pages to /dashboard.
  if (isAuthRoute && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow request to proceed normally if security rules pass.
  return NextResponse.next();
}

// Config matcher dictates which routes Next.js middleware runs on.
export const config = {
  matcher: [
    /*
     * Match all request paths except static files, _next internal files,
     * favicon, and public images.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
