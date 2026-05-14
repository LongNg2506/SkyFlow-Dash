"use client"

import { useCallback, useEffect, useState } from "react"
import { getTasks, getTasksForUser } from "../services/task-services"
import type { Task } from "../services/types/task-types"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"

export function useTasks(currentUser: CurrentUserProfile | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const uid = currentUser?.uid
  const systemRole = currentUser?.systemRole
  const teamRoles = currentUser?.teamRoles

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (uid) {
        setTasks(await getTasksForUser(uid, systemRole ?? "User", teamRoles ?? []))
      } else {
        setTasks(await getTasks())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.")
    } finally {
      setLoading(false)
    }
  }, [uid, systemRole, teamRoles])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { tasks, setTasks, loading, error, refresh }
}
