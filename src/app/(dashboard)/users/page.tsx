"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { StatCards } from "@/modules/users/components/stat-cards"
import { DataTable } from "@/modules/users/components/data-table"
import {
  buildUsersWithStats,
  createUser,
  deactivateUser,
  getUsers,
  updateUser,
} from "@/modules/users/services/user-services"
import { getUserTeamMemberships } from "@/modules/teams/services/team-services"
import { getTasks } from "@/modules/tasks/services/task-services"
import type { User, UserFormValues } from "@/modules/users/services/types/user-types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [memberships, setMemberships] = useState<
    Array<{ uid: string; teamName: string; role?: string }>
  >([])
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof getTasks>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [userList, taskList] = await Promise.all([getUsers(), getTasks()])
        setUsers(sortUsersBySystemRole(userList))
        setTasks(taskList)
        try {
          setMemberships(await getUserTeamMemberships())
        } catch {
          setMemberships([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleAddUser = async (userData: UserFormValues) => {
    try {
      const newUser = await createUser(users, userData)
      setUsers(prev => sortUsersBySystemRole([newUser, ...prev]))
      toast.success("User profile created. Ask them to sign up with this email to set a password.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.")
    }
  }

  const handleDeactivateUser = async (uid: string) => {
    try {
      await deactivateUser(uid)
    } catch {
      // Keep local state usable when Firebase is not configured.
    }
    setUsers(prev => sortUsersBySystemRole(prev.map(user => user.uid === uid ? { ...user, status: "Inactive" } : user)))
    toast.success("User deactivated.")
  }

  const handleEditUser = async (user: User, values: UserFormValues) => {
    if (
      values.systemRole === "Admin" &&
      users.some((item) => item.uid !== user.uid && item.systemRole === "Admin")
    ) {
      toast.error("Only one Admin is allowed for this project.")
      return
    }
    if (
      values.systemRole === "Manager" &&
      users.some((item) => item.uid !== user.uid && item.systemRole === "Manager")
    ) {
      toast.error("Only one Manager is allowed for this project.")
      return
    }
    const updated: User = { ...user, ...values, updatedAt: new Date().toISOString() }
    try {
      await updateUser(updated)
    } catch {
      // Keep local state usable when Firebase is not configured.
    }
    setUsers(prev => sortUsersBySystemRole(prev.map(item => item.uid === user.uid ? updated : item)))
    toast.success("User updated.")
  }

  const usersWithStats = buildUsersWithStats(users, memberships, tasks)

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <StatCards users={usersWithStats} />
      </div>
      {error ? (
        <div className="px-4 text-sm text-destructive lg:px-6">{error}</div>
      ) : null}
      
      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        <DataTable 
          users={usersWithStats}
          onDeactivateUser={handleDeactivateUser}
          onEditUser={handleEditUser}
          onAddUser={handleAddUser}
        />
      </div>
    </div>
  )
}

const SYSTEM_ROLE_ORDER = {
  Admin: 0,
  Manager: 1,
  User: 2,
} as const

function sortUsersBySystemRole(users: User[]) {
  return [...users].sort((a, b) => {
    const roleCompare =
      SYSTEM_ROLE_ORDER[a.systemRole] - SYSTEM_ROLE_ORDER[b.systemRole]
    if (roleCompare !== 0) return roleCompare
    return a.displayName.localeCompare(b.displayName)
  })
}
