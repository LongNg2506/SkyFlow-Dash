"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Ban, CheckCircle2, Database, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableViewOptions } from "./data-table-view-options"
import { AddTaskModal } from "./add-task-modal"

import {
  categories,
  priorities,
  statuses,
} from "@/modules/tasks/services/task-mock-data"
import type { Task } from "@/modules/tasks/services/types/task-types"
import type { Team } from "@/modules/teams/services/types/team-types"
import type { SystemRole } from "@/modules/users/services/types/user-types"
import type { UserTeamRole } from "@/modules/tasks/services/task-services"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddTask?: (task: Task) => void | Promise<void>
  onUpdateTask?: (task: Task) => void | Promise<void>
  onSeedTasks?: () => void | Promise<void>
  isSeedingTasks?: boolean
  teams?: Team[]
  systemRole?: SystemRole
  currentUserUid?: string
  teamRoles?: UserTeamRole[]
}

export function DataTableToolbar<TData>({
  table,
  onAddTask,
  onUpdateTask,
  onSeedTasks,
  isSeedingTasks,
  teams = [],
  systemRole,
  currentUserUid,
  teamRoles = [],
}: DataTableToolbarProps<TData>) {
  const canManageTasks = systemRole === "Admin" || systemRole === "Manager"
  const canSeedData = systemRole === "Admin"
  const statusOptions = statuses
  const isFiltered = table.getState().columnFilters.length > 0
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false)
  const selectedTasks = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as Task)
  const actionableSelectedTasks = selectedTasks.filter((task) =>
    canBulkUpdateTask(task, currentUserUid, systemRole, teamRoles)
  )
  const doneReadySelectedTasks = actionableSelectedTasks.filter(
    (task) => task.status === "review"
  )
  const hasSelectedRows = selectedTasks.length > 0
  const canBulkUpdate = actionableSelectedTasks.length > 0 && Boolean(onUpdateTask)
  const canBulkDone = doneReadySelectedTasks.length > 0 && Boolean(onUpdateTask)

  const handleStatusChange = (value: string) => {
    const column = table.getColumn("status")
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const handleCategoryChange = (value: string) => {
    const column = table.getColumn("category")
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const handlePriorityChange = (value: string) => {
    const column = table.getColumn("priority")
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const handleTeamChange = (value: string) => {
    table.getColumn("teamId")?.setFilterValue(value === "all" ? undefined : value)
  }

  const handleAssigneeChange = (value: string) => {
    table.getColumn("assigneeId")?.setFilterValue(value === "all" ? undefined : value)
  }

  const handleBulkStatusChange = async (status: "done" | "cancelled") => {
    if (!onUpdateTask) return

    const targetTasks =
      status === "done" ? doneReadySelectedTasks : actionableSelectedTasks

    if (targetTasks.length === 0) return

    try {
      setIsBulkUpdating(true)
      const now = new Date().toISOString()
      await Promise.all(
        targetTasks.map((task) =>
          onUpdateTask({
            ...task,
            status,
            doneDate: status === "done" ? task.doneDate || now : "",
          })
        )
      )
      table.resetRowSelection()
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const statusFilter = table.getColumn("status")?.getFilterValue() as
    | string
    | undefined
  const categoryFilter = table.getColumn("category")?.getFilterValue() as
    | string
    | undefined
  const priorityFilter = table.getColumn("priority")?.getFilterValue() as
    | string
    | undefined
  const teamFilter = table.getColumn("teamId")?.getFilterValue() as string | undefined
  const assigneeFilter = table.getColumn("assigneeId")?.getFilterValue() as string | undefined
  const assignees = Array.from(
    new Map(
      table
        .getPreFilteredRowModel()
        .rows.map((row) => row.original as Task)
        .flatMap((task) =>
          task.assigneeId
            ? [[task.assigneeId, task.assigneeName || task.assigneeEmail || task.assigneeId] as const]
            : []
        )
    ).entries()
  )

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {/* Status Filter */}
          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Status
              </SelectItem>
              {statusOptions.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    {status.icon && (
                      <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={teamFilter || "all"} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Teams
              </SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id} className="cursor-pointer">
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter || "all"} onValueChange={handleAssigneeChange}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Assignees
              </SelectItem>
              {assignees.map(([id, name]) => (
                <SelectItem key={id} value={id} className="cursor-pointer">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={categoryFilter || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Categories
              </SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category.value}
                  value={category.value}
                  className="cursor-pointer"
                >
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter || "all"}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Priorities
              </SelectItem>
              {priorities.map((priority) => (
                <SelectItem
                  key={priority.value}
                  value={priority.value}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    {priority.icon && (
                      <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    {priority.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search and Actions Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search Task"
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className=" w-[200px] lg:w-[300px] cursor-text"
          />
          <Button
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="px-3 cursor-pointer"
            disabled={!isFiltered}
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {hasSelectedRows ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => handleBulkStatusChange("done")}
                disabled={!canBulkDone || isBulkUpdating}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden lg:block">Done</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer text-destructive hover:text-destructive"
                onClick={() => handleBulkStatusChange("cancelled")}
                disabled={!canBulkUpdate || isBulkUpdating}
              >
                <Ban className="h-4 w-4" />
                <span className="hidden lg:block">Cancel</span>
              </Button>
            </>
          ) : null}
          {canSeedData ? (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={onSeedTasks}
              disabled={!onSeedTasks || isSeedingTasks}
            >
              <Database className="h-4 w-4" />
              <span className="hidden lg:block">
                {isSeedingTasks ? "Seeding..." : "Seed Data"}
              </span>
            </Button>
          ) : null}
          <DataTableViewOptions table={table} />
          {canManageTasks ? <AddTaskModal onAddTask={onAddTask} teams={teams} /> : null}
        </div>
      </div>
    </div>
  )
}

function canBulkUpdateTask(
  task: Task,
  currentUserUid?: string,
  systemRole?: SystemRole,
  teamRoles: UserTeamRole[] = []
) {
  if (systemRole === "Admin" || systemRole === "Manager") return true
  if (task.status === "done") return false
  if (!currentUserUid) return false
  if (task.assigneeId === currentUserUid) return true

  const canManageTeamTask = teamRoles.some(
    (teamRole) =>
      teamRole.teamId === task.teamId &&
      (teamRole.role === "Leader" || teamRole.role === "Vice Leader")
  )

  return Boolean(canManageTeamTask && task.teamId && !task.assigneeId)
}
