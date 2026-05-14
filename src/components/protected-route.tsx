"use client"

import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase/client"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!auth) {
      // Firebase not configured — allow access for dev/preview
      if (!cancelled) {
        setIsAuthenticated(false)
        setIsLoading(false)
      }
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (cancelled) return

      if (!user) {
        router.replace("/sign-in")
      } else {
        setIsAuthenticated(true)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
