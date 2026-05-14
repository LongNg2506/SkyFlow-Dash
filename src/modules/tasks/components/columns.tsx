"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import {
  categories,
  priorities,
  statuses,
} from "@/modules/tasks/services/task-mock-data"
import type { Task } from "@/modules/tasks/services/types/task-types"
import { calculateTaskDaysLeft } from "@/modules/tasks/services/task-services"
import type { UserTeamRole } from "@/modules/tasks/services/task-services"
import type { SystemRole } from "@/modules/users/services/types/user-types"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

interface TaskColumnActions {
  onUpdateTask?: (task: Task) => void | Promise<void>
  onDeleteTask?: (taskId: string) => void | Promise<void>
  onDuplicateTask?: (task: Task) => void | Promise<void>
  currentUserUid?: string
  systemRole?: SystemRole
  teamRoles?: UserTeamRole[]
  currentUser?: CurrentUserProfile | null
}

export function getTaskColumns({
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  currentUserUid,
  systemRole,
  teamRoles,
  currentUser,
}: TaskColumnActions = {}): ColumnDef<Task>[] {
  const canManageTasks = systemRole === "Admin" || systemRole === "Manager"
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] cursor-pointer"
        />
      ),
      cell: ({ row }) => {
        const isDoneReadonly = row.original.status === "done" && !canManageTasks

        if (isDoneReadonly) {
          return null
        }

        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px] cursor-pointer"
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task" />
      ),
      cell: ({ row }) => (
        <div className="w-[90px] font-medium">{row.getValue("id")}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              {row.getValue("title")}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = categories.find(
          (cat) => cat.value === row.getValue("category")
        )

        if (!category) {
          return null
        }

        return (
          <div className="flex w-[120px] items-center">
            <Badge variant="outline">{category.label}</Badge>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "teamId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Team" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-sm">
          {row.original.teamName || "Unassigned"}
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: "assigneeId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignee" />
      ),
      cell: ({ row }) => (
        <div className="flex max-w-[180px] flex-col">
          <span className="truncate text-sm font-medium">
            {row.original.assigneeName || "Unassigned"}
          </span>
          {row.original.assigneeEmail ? (
            <span className="truncate text-xs text-muted-foreground">
              {row.original.assigneeEmail}
            </span>
          ) : null}
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        )

        if (!status) {
          return null
        }

        return (
          <div className="flex w-[130px] items-center">
            {status.icon && (
              <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{status.label}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.startDate
            ? new Date(row.original.startDate).toLocaleDateString("en-US")
            : "No start date"}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate
        const overdue = isTaskOverdue(row.original)
        return (
          <div className="flex flex-col">
            <span className={cn("text-sm", overdue ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
              {dueDate ? new Date(dueDate).toLocaleDateString("en-US") : "No due date"}
            </span>
            {overdue ? (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Overdue
              </span>
            ) : null}
          </div>
        )
      },
    },
    {
      accessorKey: "doneDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Done Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.doneDate
            ? new Date(row.original.doneDate).toLocaleDateString("en-US")
            : "-"}
        </span>
      ),
    },
    {
      id: "daysLeft",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Days Left" />
      ),
      cell: ({ row }) => {
        const daysLeft = calculateTaskDaysLeft(row.original.dueDate)

        if (daysLeft === null) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        const label =
          daysLeft < 0
            ? `${Math.abs(daysLeft)} overdue`
            : daysLeft === 0
              ? "Due today"
              : `${daysLeft} day(s)`

        return (
          <span
            className={cn(
              "text-sm",
              daysLeft <= 1
                ? "font-medium text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        )
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue("priority")
        )

        if (!priority) {
          return null
        }

        const priorityColors = {
          critical: "border-red-700 text-red-700 dark:text-red-400",
          high: "border-orange-500 text-orange-700 dark:text-orange-400",
          medium: "border-blue-500 text-blue-700 dark:text-blue-400",
          low: "border-gray-500 text-gray-700 dark:text-gray-400",
        }

        return (
          <div className="flex items-center">
            <Badge
              variant="outline"
              className={cn(
                "pl-2",
                priorityColors[priority.value as keyof typeof priorityColors]
              )}
            >
              <span className="text-sm">{priority.label}</span>
            </Badge>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onDuplicateTask={onDuplicateTask}
          currentUserUid={currentUserUid}
          systemRole={systemRole}
          teamRoles={teamRoles}
          currentUser={currentUser}
        />
      ),
    },
  ]
}

export const columns = getTaskColumns()

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
