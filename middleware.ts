import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication (redirect to /sign-in if not authenticated)
const PROTECTED_ROUTES = ["/dashboard", "/dashboard-2", "/dashboard-3", "/tasks", "/users", "/teams", "/chat", "/mail", "/calendar", "/settings", "/mock-data", "/faqs", "/pricing"]

// Routes only for unauthenticated users (redirect to /dashboard if authenticated)
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"]

// Root route also needs redirect
const ROOT_ROUTE = "/"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Get Firebase token from httpOnly cookie set by the app after sign-in
  const firebaseToken = request.cookies.get("firebase-auth-token")?.value
  const isAuthenticated = !!firebaseToken

  // Root route: always redirect to dashboard
  if (pathname === ROOT_ROUTE) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  // Auth routes: redirect authenticated users to dashboard
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Protected routes: redirect unauthenticated users to sign-in
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/sign-in"
      // Preserve the original URL to redirect back after login
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - landing page (public)
     * - error pages (public)
     */
    "/((?!_next/static|_next/image|favicon.ico|landing|errors).*)",
  ],
}
