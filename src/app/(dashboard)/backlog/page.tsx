"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, CheckCircle2, Clock, Columns3, List, ListOrdered } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import { useTasks } from "@/modules/tasks/hooks/useTasks"
import {
  createTask,
  deleteTask,
  getTaskStats,
  seedTasksWithClient,
  updateTask,
} from "@/modules/tasks/services/task-services"
import type { Task } from "@/modules/tasks/services/types/task-types"
import { BacklogKanban } from "@/modules/tasks/components/backlog-kanban"
import { BacklogList } from "@/modules/tasks/components/backlog-list"

type ViewMode = "kanban" | "list"

export default function BacklogPage() {
  const { profile } = useCurrentUserProfile()
  const { tasks, setTasks, loading, refresh } = useTasks(profile)
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [isSeedingTasks, setIsSeedingTasks] = useState(false)

  const stats = getTaskStats(tasks)
  const backlogTasks = tasks.filter((t) => t.status === "backlog")
  const activeTasks = tasks.filter(
    (t) => t.status !== "backlog" && t.status !== "done" && t.status !== "cancelled"
  )
  const completedTasks = tasks.filter((t) => t.status === "done")

  const handleTaskMove = useCallback(
    async (task: Task, newStatus: string) => {
      const validationError = validateTaskMove(
        task,
        newStatus,
        profile?.systemRole,
        profile?.teamRoles ?? []
      )

      if (validationError) {
        toast.error(validationError)
        return
      }

      const updated: Task = { ...task, status: newStatus }
      try {
        await updateTask(updated)
        setTasks((prev: Task[]) =>
          prev.map((t) => (t.id === task.id ? updated : t))
        )
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to move task"
        )
      }
    },
    [profile?.systemRole, profile?.teamRoles, setTasks]
  )

  const handleSeedTasks = useCallback(async () => {
    try {
      setIsSeedingTasks(true)
      const seededTasks = await seedTasksWithClient()
      setTasks(seededTasks)
      toast.success("Tasks seeded.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to seed tasks."
      )
    } finally {
      setIsSeedingTasks(false)
    }
  }, [setTasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading backlog...</div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
            <p className="text-muted-foreground">
              Manage your backlog and track all tasks across statuses.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedTasks}
            disabled={isSeedingTasks}
            className="cursor-pointer"
          >
            {isSeedingTasks ? "Seeding..." : "Seed Data"}
          </Button>
        </div>
      </div>

      <div className="h-full flex-1 flex-col space-y-6 px-4 md:px-6 md:flex">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Total
                  </p>
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <Archive className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Backlog
                  </p>
                  <span className="text-2xl font-bold">{backlogTasks.length}</span>
                </div>
                <List className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Active
                  </p>
                  <span className="text-2xl font-bold">{activeTasks.length}</span>
                </div>
                <Clock className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Completed
                  </p>
                  <span className="text-2xl font-bold">{completedTasks.length}</span>
                </div>
                <CheckCircle2 className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle + Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Task Board</CardTitle>
                <CardDescription>
                  Drag tasks to change status, or use the list view for prioritized ordering.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  type="button"
                  variant={viewMode === "kanban" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 cursor-pointer px-2"
                  onClick={() => setViewMode("kanban")}
                >
                  <Columns3 className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline text-xs">Kanban</span>
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 cursor-pointer px-2"
                  onClick={() => setViewMode("list")}
                >
                  <ListOrdered className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline text-xs">List</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "kanban" ? (
              <BacklogKanban tasks={tasks} onTaskMove={handleTaskMove} />
            ) : (
              <BacklogList tasks={tasks} onTaskMove={handleTaskMove} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function validateTaskMove(
  task: Task,
  newStatus: string,
  systemRole?: string,
  teamRoles: Array<{ teamId: string; role: "Leader" | "Vice Leader" | "Member" }> = []
) {
  if (newStatus === "done" && task.status !== "review") {
    return "Task must be in Review before moving to Done."
  }

  if (systemRole === "Admin" || systemRole === "Manager") {
    return null
  }

  if (task.status === "done") {
    return "Done tasks can only be changed by Admin or Manager."
  }

  const canManageTaskTeam = teamRoles.some(
    (teamRole) =>
      teamRole.teamId === task.teamId &&
      (teamRole.role === "Leader" || teamRole.role === "Vice Leader")
  )

  if (!canManageTaskTeam) {
    return "Only the team Leader or Vice Leader can move this task."
  }

  return null
}
