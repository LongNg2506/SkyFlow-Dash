"use client"

import { useCallback, useEffect, useState } from "react"
import { getUsers } from "../services/user-services"
import type { User } from "../services/types/user-types"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUsers(await getUsers())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { users, setUsers, loading, error, refresh }
}
