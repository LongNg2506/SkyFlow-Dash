import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication (redirect to /sign-in if not authenticated)
const PROTECTED_ROUTES = [
  "/dashboard-2",
  "/tasks",
  "/users",
  "/teams",
  "/chat",
  "/mail",
  "/calendar",
  "/settings",
  "/mock-data",
  "/faqs",
  "/pricing",
]

// Routes only for unauthenticated users (redirect to /dashboard-2 if authenticated)
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Get Firebase token from httpOnly cookie set by the app after sign-in
  const firebaseToken = request.cookies.get("firebase-auth-token")?.value
  const isAuthenticated = !!firebaseToken

  // Legacy redirects
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/sign-up", request.url))
  }

  // Root route: always redirect to dashboard-2
  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard-2"
    return NextResponse.redirect(redirectUrl)
  }

  // Auth routes: redirect authenticated users to dashboard-2
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard-2"
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Protected routes: redirect unauthenticated users to sign-in
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/sign-in"
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|landing|errors|api).*)",
  ],
}
