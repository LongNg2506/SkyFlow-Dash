"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUp, BarChart3, CheckCircle2, Clock, ListTodo } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getTaskColumns } from "@/modules/tasks/components/columns"
import { DataTable } from "@/modules/tasks/components/data-table"
import {
  createTask,
  deleteTask,
  getTaskStats,
  seedTasksWithClient,
  updateTask,
} from "@/modules/tasks/services/task-services"
import {
  notifyTaskAssigned,
  notifyTaskStatusChanged,
  checkTaskDeadlines,
} from "@/modules/notifications/services/notification-services"
import type { Task } from "@/modules/tasks/services/types/task-types"
import { getTeams } from "@/modules/teams/services/team-services"
import type { Team } from "@/modules/teams/services/types/team-types"
import { useTasks } from "@/modules/tasks/hooks/useTasks"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import type { SystemRole } from "@/modules/users/services/types/user-types"

export default function TaskPage() {
  const { profile } = useCurrentUserProfile()
  const { tasks, setTasks, loading, error, refresh } = useTasks(profile)
  const [teams, setTeams] = useState<Team[]>([])
  const [isSeedingTasks, setIsSeedingTasks] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!profile) {
      setProfileLoading(false)
      return
    }
    setProfileLoading(false)
    getTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
  }, [profile])

  // Check deadlines for current user's tasks on page load
  useEffect(() => {
    if (tasks.length > 0 && profile?.uid) {
      checkTaskDeadlines(tasks, profile.uid).catch(() => {/* non-critical */})
    }
  }, [tasks.length, profile?.uid])

  const handleAddTask = useCallback(
    async (newTask: Task) => {
      const created = await createTask(newTask)
      await refresh()
      toast.success("Task created.")

      // Notify assignee
      if (newTask.assigneeId && newTask.assigneeId !== profile?.uid) {
        const senderId = profile?.uid ?? ""
        const senderName = profile?.displayName ?? "Someone"
        await notifyTaskAssigned(
          created,
          newTask.assigneeId,
          newTask.assigneeName ?? newTask.assigneeId,
          senderId,
          senderName
        ).catch(() => {/* notification error is non-critical */})
      }

      // Check deadlines for this user's tasks
      if (profile?.uid) {
        checkTaskDeadlines([created], profile.uid).catch(() => {/* non-critical */})
      }
    },
    [refresh, profile]
  )

  const handleUpdateTask = useCallback(async (task: Task) => {
    const prevTask = tasks.find((t) => t.id === task.id)
    const updatedTask = await updateTask(task)
    setTasks((prev: Task[]) => prev.map((item: Task) => (item.id === updatedTask.id ? updatedTask : item)))
    toast.success("Task updated.")

    // Notify status change
    if (prevTask && prevTask.status !== task.status) {
      const senderId = profile?.uid ?? ""
      const senderName = profile?.displayName ?? "Someone"
      const recipientIds: string[] = []
      if (task.assigneeId && task.assigneeId !== profile?.uid) {
        recipientIds.push(task.assigneeId)
      }
      if (prevTask.assigneeId && prevTask.assigneeId !== profile?.uid && !recipientIds.includes(prevTask.assigneeId)) {
        recipientIds.push(prevTask.assigneeId)
      }
      if (recipientIds.length > 0) {
        notifyTaskStatusChanged(
          updatedTask,
          prevTask.status,
          task.status,
          senderId,
          senderName,
          recipientIds
        ).catch(() => {/* non-critical */})
      }
    }

    // Check deadlines for this user's tasks
    if (profile?.uid) {
      checkTaskDeadlines([updatedTask], profile.uid).catch(() => {/* non-critical */})
    }
  }, [setTasks, tasks, profile])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
    setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId))
    toast.success("Task deleted.")
  }, [setTasks])

  const handleDuplicateTask = useCallback(async (task: Task) => {
    const duplicate: Task = {
      ...task,
      id: `TASK-${Date.now()}`,
      title: `${task.title} (Copy)`,
    }

    const createdTask = await createTask(duplicate)
    setTasks((prev: Task[]) => [createdTask, ...prev])
    toast.success("Task duplicated.")
  }, [setTasks])

  const handleSeedTasks = useCallback(async () => {
    try {
      setIsSeedingTasks(true)
      const seededTasks = await seedTasksWithClient()
      setTasks(seededTasks)
      toast.success("Tasks seeded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed tasks.")
    } finally {
      setIsSeedingTasks(false)
    }
  }, [setTasks])

  const taskColumns = useMemo(
    () =>
      getTaskColumns({
        onUpdateTask: handleUpdateTask,
        onDeleteTask: handleDeleteTask,
        onDuplicateTask: handleDuplicateTask,
        currentUserUid: profile?.uid ?? "",
        systemRole: profile?.systemRole ?? "User",
        teamRoles: profile?.teamRoles ?? [],
        currentUser: profile,
      }),
    [handleDeleteTask, handleDuplicateTask, handleUpdateTask, profile]
  )

  const stats = getTaskStats(tasks)
  const getPercent = (value: number) =>
    stats.total > 0 ? Math.round((value / stats.total) * 100) : 0

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          A powerful task and issue tracker built with Tanstack Table.
        </p>
      </div>
      {error ? (
        <div className="px-4 text-sm text-destructive md:px-6">{error}</div>
      ) : null}

      {/* Mobile view placeholder - shows message instead of images */}
      <div className="md:hidden px-4 md:px-6">
        <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">Tasks Dashboard</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full tasks interface.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:px-6 md:flex">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Total Tasks
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.completed)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <ListTodo className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Done
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {stats.completed}
                    </span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.completed)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <CheckCircle2 className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    In Progress
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {stats.inProgress}
                    </span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.inProgress)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Clock className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    To Do
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.pending}</span>
                    <span className="flex items-center gap-0.5 text-sm text-orange-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.pending)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <BarChart3 className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>
              View, filter, and manage all your project tasks in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={tasks}
              columns={taskColumns}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onSeedTasks={handleSeedTasks}
              isSeedingTasks={isSeedingTasks}
              teams={teams}
              systemRole={profile?.systemRole}
              currentUserUid={profile?.uid ?? ""}
              teamRoles={profile?.teamRoles ?? []}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
