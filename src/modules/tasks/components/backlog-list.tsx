"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronsUp,
  List,
  MessageSquare,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { priorities, statuses } from "@/modules/tasks/services/task-mock-data"
import type { Task } from "@/modules/tasks/services/types/task-types"

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  backlog: List,
}

interface BacklogListProps {
  tasks: Task[]
  onTaskMove?: (task: Task, newStatus: string) => void
}

export function BacklogList({ tasks, onTaskMove }: BacklogListProps) {
  const sorted = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99
      const pb = PRIORITY_ORDER[b.priority] ?? 99
      if (pa !== pb) return pa - pb

      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return dateA - dateB
    })
  }, [tasks])

  const isOverdue = (task: Task) =>
    task.dueDate &&
    task.status !== "done" &&
    task.status !== "cancelled" &&
    new Date(task.dueDate) < new Date()

  const nonBacklogStatuses = statuses.filter((s) => s.value !== "backlog")

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No tasks to display.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-320px)]">
      <div className="space-y-2 pr-2">
        {sorted.map((task, index) => {
          const priority = priorities.find((p) => p.value === task.priority)
          const PriorityIcon = priority?.icon
          const priorityColors: Record<string, string> = {
            critical: "text-red-600 dark:text-red-400",
            high: "text-orange-600 dark:text-orange-400",
            medium: "text-blue-600 dark:text-blue-400",
            low: "text-gray-600 dark:text-gray-400",
          }
          const overdue = isOverdue(task)
          const status = statuses.find((s) => s.value === task.status)
          const StatusIcon = status?.icon ?? List

          return (
            <Card
              key={task.id}
              className={cn(
                "transition-colors hover:bg-muted/30",
                task.status === "backlog" && "border-dashed"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Priority icon */}
                  <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    {PriorityIcon ? (
                      <PriorityIcon
                        className={cn(
                          "h-4 w-4",
                          priorityColors[task.priority]
                        )}
                      />
                    ) : null}
                  </div>

                  {/* Rank number */}
                  <span className="flex-shrink-0 w-6 text-xs text-muted-foreground text-center font-mono">
                    {index + 1}
                  </span>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium line-clamp-1",
                          task.status === "backlog" && "text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {task.status === "backlog" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 font-normal"
                        >
                          Backlog
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {task.assigneeName && (
                        <span className="text-[11px] text-muted-foreground">
                          {task.assigneeName}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={cn(
                            "text-[11px]",
                            overdue
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {overdue ? " (overdue)" : ""}
                        </span>
                      )}
                      {task.category && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1.5 font-normal"
                        >
                          {task.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {status?.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 cursor-pointer"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                          Move to
                        </div>
                        {nonBacklogStatuses
                          .filter((s) => s.value !== task.status)
                          .map((s) => {
                            const Icon = s.icon ?? List
                            return (
                              <DropdownMenuItem
                                key={s.value}
                                className="cursor-pointer"
                                onClick={() => onTaskMove?.(task, s.value)}
                              >
                                <Icon className="h-3.5 w-3.5 mr-2" />
                                {s.label}
                              </DropdownMenuItem>
                            )
                          })}
                        {task.status !== "backlog" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-muted-foreground"
                              onClick={() => onTaskMove?.(task, "backlog")}
                            >
                              <List className="h-3.5 w-3.5 mr-2" />
                              Move to Backlog
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}
