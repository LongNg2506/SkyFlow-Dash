"use client"

import * as React from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Archive, GripVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { statuses } from "@/modules/tasks/services/task-mock-data"
import type { Task } from "@/modules/tasks/services/types/task-types"
import { priorities } from "@/modules/tasks/services/task-mock-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const KANBAN_STATUSES = statuses
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

interface BacklogKanbanProps {
  tasks: Task[]
  onTaskMove?: (task: Task, newStatus: string) => void | Promise<void>
}

export function BacklogKanban({ tasks, onTaskMove }: BacklogKanbanProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  )

  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    for (const status of KANBAN_STATUSES) {
      grouped[status.value] = tasks.filter((t) => t.status === status.value)
    }
    return grouped
  }, [tasks])

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newStatus = String(over.id)
    const isValidStatus = KANBAN_STATUSES.some((s) => s.value === newStatus)

    if (isValidStatus && newStatus !== task.status) {
      await onTaskMove?.(task, newStatus)
    }
  }

  const board = (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((status) => (
        <KanbanColumn
          key={status.value}
          status={status}
          tasks={tasksByStatus[status.value] ?? []}
          isDraggable={isMounted}
          showOverdue={isMounted}
        />
      ))}
    </div>
  )

  if (!isMounted) {
    return board
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {board}

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1 scale-105 opacity-95">
            <KanbanCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnProps {
  status: (typeof KANBAN_STATUSES)[number]
  tasks: Task[]
  isDraggable: boolean
  showOverdue: boolean
}

function KanbanColumn({
  status,
  tasks,
  isDraggable,
  showOverdue,
}: KanbanColumnProps) {
  const StatusIcon = status.icon ?? Archive

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{status.label}</span>
        <Badge
          variant="secondary"
          className="h-5 min-w-6 justify-center px-1.5 text-xs font-medium"
        >
          {tasks.length}
        </Badge>
      </div>

      {/* Droppable column area */}
      <DroppableColumn columnId={status.value}>
        <ScrollArea className="h-[calc(100vh-320px)] rounded-md border bg-muted/20 p-2">
          <div className="space-y-2 min-h-12">
            {tasks.length === 0 ? (
              <div className="h-20 flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center">
                  No tasks
                </p>
              </div>
            ) : (
              tasks.map((task) =>
                isDraggable ? (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    showOverdue={showOverdue}
                  />
                ) : (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    showOverdue={showOverdue}
                  />
                )
              )
            )}
          </div>
        </ScrollArea>
      </DroppableColumn>
    </div>
  )
}

interface DroppableColumnProps {
  columnId: string
  children: React.ReactNode
}

function DroppableColumn({ columnId, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md transition-colors",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {children}
    </div>
  )
}

interface DraggableTaskCardProps {
  task: Task
  showOverdue: boolean
}

function DraggableTaskCard({ task, showOverdue }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none transition-opacity",
        isDragging && "opacity-30"
      )}
      {...attributes}
      {...listeners}
    >
      <KanbanCard task={task} showOverdue={showOverdue} />
    </div>
  )
}

interface KanbanCardProps {
  task: Task
  isDragging?: boolean
  showOverdue?: boolean
}

function KanbanCard({ task, isDragging, showOverdue = true }: KanbanCardProps) {
  const priority = priorities.find((p) => p.value === task.priority)
  const priorityColors: Record<string, string> = {
    critical: "border-red-300 dark:border-red-700",
    high: "border-orange-300 dark:border-orange-700",
    medium: "border-blue-300 dark:border-blue-700",
    low: "border-gray-300 dark:border-gray-700",
  }
  const priorityTextColors: Record<string, string> = {
    critical: "text-red-600 dark:text-red-400",
    high: "text-orange-600 dark:text-orange-400",
    medium: "text-blue-600 dark:text-blue-400",
    low: "text-gray-600 dark:text-gray-400",
  }
  const isOverdue =
    showOverdue &&
    task.dueDate &&
    task.status !== "done" &&
    task.status !== "cancelled" &&
    task.dueDate < getTodayDateKey()

  return (
    <Card
      className={cn(
        "text-sm select-none cursor-grab active:cursor-grabbing",
        priorityColors[task.priority] ?? "border-border",
        isDragging && "shadow-lg ring-2 ring-primary/40"
      )}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-medium leading-snug line-clamp-2">
              {task.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {priority && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-4 px-1.5 font-normal",
                priorityTextColors[priority.value]
              )}
            >
              {priority.label}
            </Badge>
          )}
          {task.category && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
              {task.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {task.assigneeName ? (
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px]">
                  {task.assigneeName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : null}
            {task.assigneeName && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                {task.assigneeName}
              </span>
            )}
          </div>
          {task.dueDate && (
            <span
              className={cn(
                "text-[10px]",
                isOverdue
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {formatDateOnly(task.dueDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value

  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const month = MONTH_LABELS[monthIndex]

  if (!month || Number.isNaN(day)) return value
  return `${month} ${day}`
}

function getTodayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
