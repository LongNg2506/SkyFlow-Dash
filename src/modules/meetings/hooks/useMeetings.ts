"use client"

import { useCallback, useEffect, useState } from "react"
import { getMeetings } from "../services/meeting-services"
import type { Meeting } from "../services/types/meeting-types"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"

export function useMeetings(currentUser: CurrentUserProfile | null) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const uid = currentUser?.uid
  const systemRole = currentUser?.systemRole

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMeetings()
      setMeetings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { meetings, setMeetings, loading, error, refresh }
}
