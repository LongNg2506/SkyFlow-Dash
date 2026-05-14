"use server"

import { cookies } from "next/headers"

const AUTH_COOKIE_NAME = "firebase-auth-token"

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function getAuthTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null
}

// Pass idToken string directly to avoid circular reference serialization issues
export async function setAuthCookieFromIdToken(idToken: string): Promise<void> {
  await setAuthCookie(idToken)
}
