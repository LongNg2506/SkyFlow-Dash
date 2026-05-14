"use client"

import * as React from "react"
import type { Row } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  categories,
  priorities,
  statuses,
} from "@/modules/tasks/services/task-mock-data"
import {
  taskSchema,
  type Task,
} from "@/modules/tasks/services/types/task-types"
import type { UserTeamRole } from "@/modules/tasks/services/task-services"
import {
  calculateTaskDaysLeft,
  calculateTaskDurationDays,
} from "@/modules/tasks/services/task-services"
import type { SystemRole } from "@/modules/users/services/types/user-types"
import { CommentSection } from "./comment-section"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onUpdateTask?: (task: Task) => void | Promise<void>
  onDeleteTask?: (taskId: string) => void | Promise<void>
  onDuplicateTask?: (task: Task) => void | Promise<void>
  currentUserUid?: string
  systemRole?: SystemRole
  teamRoles?: UserTeamRole[]
  currentUser?: CurrentUserProfile | null
}

export function DataTableRowActions<TData>({
  row,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  currentUserUid,
  systemRole,
  teamRoles,
  currentUser,
}: DataTableRowActionsProps<TData>) {
  const parsed = taskSchema.safeParse(row.original)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [commentCount, setCommentCount] = React.useState(0)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Task | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!parsed.success) {
    return null
  }

  const task = parsed.data
  const isAdmin = systemRole === "Admin" || systemRole === "Manager"
  const isDoneReadonly = task.status === "done" && !isAdmin
  const isLeaderOrVice = teamRoles?.some(
    (t) => t.teamId === task.teamId && (t.role === "Leader" || t.role === "Vice Leader")
  )
  const isOwnTask = currentUserUid && task.assigneeId === currentUserUid
  const isTeamUnassignedTask =
    currentUserUid &&
    task.teamId &&
    teamRoles?.some((t) => t.teamId === task.teamId) &&
    !task.assigneeId
  const canEdit =
    isAdmin || (!isDoneReadonly && isLeaderOrVice && (isOwnTask || isTeamUnassignedTask))
  const canEditStatus = !isDoneReadonly && isLeaderOrVice && (isOwnTask || isTeamUnassignedTask)
  const canDelete = isAdmin
  const canDuplicate = isAdmin
  const editableStatuses = isAdmin
    ? statuses
    : statuses.filter((status) =>
        ["todo", "in_progress", "review"].includes(status.value)
      )

  function openEditDialog() {
    setDraft(task)
    setError(null)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!draft) return
    try {
      setIsSaving(true)
      setError(null)
      await onUpdateTask?.(draft)
      setEditOpen(false)
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update task"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setDetailOpen(true)}>
            View Details
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem className="cursor-pointer" onClick={openEditDialog}>
              Edit Task
            </DropdownMenuItem>
          )}
          {canDuplicate && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onDuplicateTask?.(task)}
            >
              Duplicate
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
                <DropdownMenuShortcut className="text-destructive">
                  ⌘⌫
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="leading-snug">{task.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>{task.taskCode ?? task.id}</span>
              {commentCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {commentCount} comment{commentCount !== 1 ? "s" : ""}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <DetailItem label="Status" value={getOptionLabel(statuses, task.status)} />
            <DetailItem label="Priority" value={getOptionLabel(priorities, task.priority)} />
            <DetailItem label="Category" value={getOptionLabel(categories, task.category)} />
            <DetailItem label="Start Date" value={formatDate(task.startDate)} />
            <DetailItem label="Due Date" value={formatDate(task.dueDate)} />
            <DetailItem label="Duration" value={formatDuration(task)} />
            <DetailItem label="Days Left" value={formatDaysLeft(task)} />
            {task.status === "done" ? (
              <DetailItem label="Done Date" value={formatDate(task.doneDate)} />
            ) : null}
            <DetailItem label="Team" value={task.teamName || "Unassigned"} />
            <DetailItem label="Assignee" value={task.assigneeName || "Unassigned"} />
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Description
              </p>
              <p className="rounded-md border bg-muted/20 p-3">
                {task.description || "No description"}
              </p>
            </div>
            {isTaskOverdue(task) ? (
              <div className="sm:col-span-2">
                <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                  Overdue
                </Badge>
              </div>
            ) : null}
          </div>
          <div className="border-t pt-4">
            <CommentSection
              task={task}
              currentUser={currentUser ?? null}
              onCommentCountChange={setCommentCount}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xoá task?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá task <strong>&quot;{task.title}&quot;</strong>? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
              className="cursor-pointer hover:bg-muted/80 transition-colors duration-150"
            >
              <X className="size-4 mr-2" />
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsDeleting(true)
                try {
                  await onDeleteTask?.(task.id)
                  setDeleteOpen(false)
                } finally {
                  setIsDeleting(false)
                }
              }}
              disabled={isDeleting}
              className="cursor-pointer hover:opacity-90 transition-opacity duration-150"
            >
              <Trash2 className="size-4 mr-2" />
              {isDeleting ? "Đang xoá..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>
              {task.taskCode ?? task.id}
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              {error ? (
                <p className="sm:col-span-2 text-sm text-destructive">{error}</p>
              ) : null}

              {/* Status is editable for Leader/ViceLeader on assigned tasks. */}
              {canEditStatus ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
                    <Select
                      value={draft?.status ?? task.status}
                      onValueChange={(value) =>
                        setDraft((current) =>
                          current ? { ...current, status: value } : current
                        )
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {editableStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DetailItem label="Priority" value={getOptionLabel(priorities, draft?.priority ?? task.priority)} />
                  <DetailItem label="Category" value={getOptionLabel(categories, draft?.category ?? task.category)} />
                  <DetailItem label="Start Date" value={formatDate(draft?.startDate ?? task.startDate)} />
                  <DetailItem label="Due Date" value={formatDate(draft?.dueDate ?? task.dueDate)} />
                  <DetailItem label="Duration" value={formatDuration(draft ?? task)} />
                  <DetailItem label="Days Left" value={formatDaysLeft(draft ?? task)} />
                  {(draft?.status ?? task.status) === "done" ? (
                    <DetailItem label="Done Date" value={formatDate(draft?.doneDate ?? task.doneDate)} />
                  ) : null}
                  <DetailItem label="Team" value={draft?.teamName || task.teamName || "Unassigned"} />
                  <DetailItem label="Assignee" value={draft?.assigneeName || task.assigneeName || "Unassigned"} />
                </>
              ) : (
                <>
                  <DetailItem label="Status" value={getOptionLabel(statuses, draft?.status ?? task.status)} />
                  <DetailItem label="Priority" value={getOptionLabel(priorities, draft?.priority ?? task.priority)} />
                  <DetailItem label="Category" value={getOptionLabel(categories, draft?.category ?? task.category)} />
                  <DetailItem label="Start Date" value={formatDate(draft?.startDate ?? task.startDate)} />
                  <DetailItem label="Due Date" value={formatDate(draft?.dueDate ?? task.dueDate)} />
                  <DetailItem label="Duration" value={formatDuration(draft ?? task)} />
                  <DetailItem label="Days Left" value={formatDaysLeft(draft ?? task)} />
                  {(draft?.status ?? task.status) === "done" ? (
                    <DetailItem label="Done Date" value={formatDate(draft?.doneDate ?? task.doneDate)} />
                  ) : null}
                  <DetailItem label="Team" value={draft?.teamName || task.teamName || "Unassigned"} />
                  <DetailItem label="Assignee" value={draft?.assigneeName || task.assigneeName || "Unassigned"} />
                </>
              )}

              {/* Description — always editable */}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Description
                </p>
                <Textarea
                  value={draft.description ?? ""}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDraft((current) =>
                      current
                        ? { ...current, description: event.target.value }
                        : current
                    )
                  }
                  placeholder={canEditStatus ? "Nhập mô tả công việc..." : "Provide additional details..."}
                  rows={3}
                />
              </div>

              {isTaskOverdue(task) ? (
                <div className="sm:col-span-2">
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                    Overdue
                  </Badge>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
              Huỷ
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("en-US") : "No due date"
}

function formatDuration(task: Task) {
  const durationDays = calculateTaskDurationDays(task.startDate, task.dueDate)
  return durationDays === null ? "-" : `${durationDays} day(s)`
}

function formatDaysLeft(task: Task) {
  const daysLeft = calculateTaskDaysLeft(task.dueDate)
  if (daysLeft === null) return "-"
  if (daysLeft < 0) return `${Math.abs(daysLeft)} overdue`
  if (daysLeft === 0) return "Due today"
  return `${daysLeft} day(s)`
}

function isTaskOverdue(task: Task) {
  if (!task.dueDate || task.status === "done" || task.status === "cancelled") {
    return false
  }

  const due = new Date(task.dueDate)
  const today = new Date()
  due.setHours(23, 59, 59, 999)
  today.setHours(0, 0, 0, 0)
  return due.getTime() < today.getTime()
}
