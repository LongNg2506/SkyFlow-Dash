import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import type { SystemRole } from "@/modules/users/services/types/user-types"
import { taskMockData } from "./task-mock-data"
import type { Task } from "./types/task-types"

export type UserTeamRole = {
  teamId: string
  role: "Leader" | "Vice Leader" | "Member"
}

const TASKS_COLLECTION = "tasks"
let tasksCache: Task[] | null = null
let tasksPromise: Promise<Task[]> | null = null

export async function getTasks(): Promise<Task[]> {
  if (tasksCache) return tasksCache
  if (tasksPromise) return tasksPromise

  tasksPromise = loadTasks()
  try {
    tasksCache = await tasksPromise
    return tasksCache
  } finally {
    tasksPromise = null
  }
}

async function loadTasks(): Promise<Task[]> {
  try {
    const snapshot = await getDocs(collection(getDb(), TASKS_COLLECTION))
    if (snapshot.empty) return taskMockData.map(normalizeTask)

    return snapshot.docs.map((document) =>
      normalizeTask({ ...(document.data() as Partial<Task>), id: document.id })
    )
  } catch (error) {
    console.warn("Failed to load tasks from Firestore. Falling back to local mock data.", error)
    return taskMockData.map(normalizeTask)
  }
}

function clearTasksCache() {
  tasksCache = null
  tasksPromise = null
}

export async function getTasksForUser(
  uid: string,
  systemRole: SystemRole,
  teamRoles: UserTeamRole[]
): Promise<Task[]> {
  const allTasks = await getTasks()

  if (systemRole === "Admin" || systemRole === "Manager") {
    return allTasks
  }

  const userTeamIds = new Set(teamRoles.map((t) => t.teamId))

  return allTasks.filter((task) => {
    if (task.assigneeId === uid) return true
    if (task.teamId && userTeamIds.has(task.teamId)) return true
    return false
  })
}

export async function seedTasksWithClient(): Promise<Task[]> {
  const batch = writeBatch(getDb())

  taskMockData.forEach((task) => {
    batch.set(doc(getDb(), TASKS_COLLECTION, task.id), normalizeTask(task), { merge: true })
  })

  await batch.commit()
  clearTasksCache()
  return getTasks()
}

export async function createTask(task: Task): Promise<Task> {
  const normalized = normalizeTask(task)
  await setDoc(doc(getDb(), TASKS_COLLECTION, normalized.id), normalized)
  clearTasksCache()

  return normalized
}

export async function updateTask(task: Task): Promise<Task> {
  const now = new Date().toISOString()
  const normalizedTask = normalizeTask(task)
  const normalized = {
    ...normalizedTask,
    doneDate:
      normalizedTask.status === "done"
        ? normalizedTask.doneDate || now
        : "",
    updatedAt: now,
  }
  await updateDoc(doc(getDb(), TASKS_COLLECTION, normalized.id), normalized)
  clearTasksCache()

  return normalized
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(getDb(), TASKS_COLLECTION, taskId))
  clearTasksCache()
}

export function normalizeTask(task: Partial<Task>): Task {
  const id = task.id ?? `TASK-${Date.now()}`
  const now = new Date().toISOString()
  const startDate = task.startDate ?? ""
  const dueDate = task.dueDate ?? ""
  const autoPriority = calculateTaskPriorityByDates(startDate, dueDate)

  return {
    id,
    taskCode: task.taskCode ?? id,
    title: task.title ?? "Untitled task",
    description: task.description ?? "",
    status: normalizeTaskStatus(task.status),
    category: task.category ?? "feature",
    priority: autoPriority ?? normalizeTaskPriority(task.priority),
    teamId: task.teamId ?? "",
    teamName: task.teamName ?? "",
    assigneeId: task.assigneeId ?? "",
    assigneeName: task.assigneeName ?? "",
    assigneeEmail: task.assigneeEmail ?? "",
    startDate,
    dueDate,
    doneDate: task.doneDate ?? "",
    createdBy: task.createdBy ?? "",
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now,
  }
}

function normalizeTaskStatus(status: unknown): string {
  if (
    status === "backlog" ||
    status === "todo" ||
    status === "in_progress" ||
    status === "review" ||
    status === "done" ||
    status === "cancelled"
  ) {
    return status
  }
  if (status === "pending") return "todo"
  if (status === "in progress") return "in_progress"
  if (status === "completed") return "done"
  return "backlog"
}

function normalizeTaskPriority(priority: unknown): string {
  if (
    priority === "low" ||
    priority === "medium" ||
    priority === "high" ||
    priority === "critical"
  ) {
    return priority
  }
  if (priority === "minor") return "low"
  if (priority === "normal") return "medium"
  if (priority === "important") return "high"
  return "medium"
}

export function calculateTaskPriorityByDates(
  startDate?: string,
  dueDate?: string,
  fromDate: Date = new Date()
): "low" | "medium" | "high" | "critical" | null {
  if (!startDate || !dueDate) return null

  const remainingDays = calculateTaskDaysLeft(dueDate, fromDate)
  if (remainingDays === null) return null

  if (remainingDays <= 1) return "critical"
  if (remainingDays <= 3) return "high"
  if (remainingDays <= 7) return "medium"
  return "low"
}

export function calculateTaskDaysLeft(
  dueDate?: string,
  fromDate: Date = new Date()
): number | null {
  if (!dueDate) return null

  const due = parseDateOnly(dueDate)
  if (!due) return null

  const today = new Date(fromDate)
  today.setHours(0, 0, 0, 0)

  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

export function calculateTaskDurationDays(
  startDate?: string,
  dueDate?: string
): number | null {
  if (!startDate || !dueDate) return null

  const start = parseDateOnly(startDate)
  const due = parseDateOnly(dueDate)
  if (!start || !due) return null

  return Math.max(0, Math.ceil((due.getTime() - start.getTime()) / 86_400_000))
}

function parseDateOnly(value: string): Date | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

export function getTaskStats(tasks: Task[]) {
  const total = tasks.length

  return {
    total,
    completed: tasks.filter((task) => task.status === "done").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    pending: tasks.filter((task) => task.status === "todo").length,
  }
}
