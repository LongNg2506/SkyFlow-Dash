import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth"

import { app, getAuthHelper } from "@/lib/firebase/client"

export async function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(getAuthHelper(), email, password)
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  displayName: string
) {
  const credential = await createUserWithEmailAndPassword(
    getAuthHelper(),
    email,
    password
  )

  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }

  return credential
}

export async function signInWithGoogle() {
  if (!app) throw new Error("Firebase is not configured.")
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  return signInWithPopup(getAuthHelper(), provider)
}

export async function signOutUser() {
  if (!app) return
  return signOut(getAuthHelper())
}

export async function sendResetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthHelper(), email)
}

export function getFirebaseAuthErrorMessage(
  error: unknown,
  mode: "signin" | "signup" = "signin"
) {
  let errorCode: string | null = null

  if (error instanceof Error) {
    const code = (error as { code?: string }).code
    if (code) {
      errorCode = code
    } else {
      const match = error.message.match(/auth\/[\w-]+/)
      if (match) errorCode = match[0]
    }
  } else if (typeof error === "string") {
    const match = error.match(/auth\/[\w-]+/)
    if (match) errorCode = match[0]
  }

  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return mode === "signup"
        ? "Email or password is invalid."
        : "Email or password is incorrect."
    case "auth/invalid-email":
      return "Email is invalid."
    case "auth/email-already-in-use":
      return "This email is already in use. Please sign in or use another email."
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters."
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later."
    case "auth/network-request-failed":
      return "Could not connect to Firebase. Please check your network."
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled."
    case "auth/popup-blocked":
      return "The browser blocked the Google sign-in popup."
    case "auth/account-exists-with-different-credential":
      return "This email is registered with another sign-in method."
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase Console."
    case "auth/user-disabled":
      return "This account has been disabled."
    case "auth/invalid-api-key":
      return "Firebase API key is invalid."
    default:
      return mode === "signup"
        ? "Could not sign up. Please try again."
        : "Could not sign in. Please try again."
  }
}
