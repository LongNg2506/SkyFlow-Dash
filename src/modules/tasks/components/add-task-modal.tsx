"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  priorities,
  statuses,
  categories,
} from "@/modules/tasks/services/task-mock-data"
import type { Task } from "@/modules/tasks/services/types/task-types"
import {
  calculateTaskDurationDays,
  calculateTaskPriorityByDates,
} from "@/modules/tasks/services/task-services"
import { getTeamMembers } from "@/modules/teams/services/team-services"
import type { Team, TeamMember } from "@/modules/teams/services/types/team-types"

// Extended task schema for the form
const taskFormSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
  teamId: z.string().min(1, "Team is required"),
  assigneeId: z.string().min(1, "Assignee is required"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
}).refine(
  (data) => new Date(data.dueDate).getTime() >= new Date(data.startDate).getTime(),
  {
    message: "Due date must be on or after start date",
    path: ["dueDate"],
  }
)

type TaskFormData = z.infer<typeof taskFormSchema>

interface AddTaskModalProps {
  onAddTask?: (task: Task) => void | Promise<void>
  teams?: Team[]
  trigger?: React.ReactNode
}

export function AddTaskModal({ onAddTask, teams = [], trigger }: AddTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TaskFormData>({
    id: "",
    title: "",
    description: "",
    status: "todo",
    category: "feature",
    priority: "medium",
    teamId: "",
    assigneeId: "",
    startDate: "",
    dueDate: "",
  })
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const autoPriority =
    calculateTaskPriorityByDates(formData.startDate, formData.dueDate) ??
    formData.priority
  const durationDays = calculateTaskDurationDays(
    formData.startDate,
    formData.dueDate
  )
  const assignableMembers = members.filter(
    (member) => member.role === "Leader" || member.role === "Vice Leader"
  )

  // Generate unique task ID
  const generateTaskId = () => {
    return `TASK-${Date.now()}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      const validatedData = taskFormSchema.parse({
        ...formData,
        priority: autoPriority,
        id: generateTaskId(),
      })
      const team = teams.find((item) => item.id === validatedData.teamId)
      const assignee = assignableMembers.find((member) => member.uid === validatedData.assigneeId)
      if (!assignee) {
        throw new Error("Only Leader or Vice Leader can be assigned to a task.")
      }

      // Create the task
      const newTask: Task = {
        id: validatedData.id,
        taskCode: validatedData.id,
        title: validatedData.title,
        description: validatedData.description ?? "",
        status: validatedData.status,
        category: validatedData.category,
        priority: validatedData.priority,
        teamId: validatedData.teamId,
        teamName: team?.name ?? "",
        assigneeId: assignee?.uid ?? "",
        assigneeName: assignee?.displayName ?? "",
        assigneeEmail: assignee?.email ?? "",
        startDate: validatedData.startDate,
        dueDate: validatedData.dueDate,
      }

      await onAddTask?.(newTask)

      // Reset form and close modal
      setFormData({
        id: "",
        title: "",
        description: "",
        status: "todo",
        category: "feature",
        priority: "medium",
        teamId: "",
        assigneeId: "",
        startDate: "",
        dueDate: "",
      })
      setErrors({})
      setOpen(false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message
          }
        })
        setErrors(newErrors)
      } else {
        setErrors({
          root:
            error instanceof Error ? error.message : "Failed to create task",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      id: "",
      title: "",
      description: "",
      status: "todo",
      category: "feature",
      priority: "medium",
      teamId: "",
      assigneeId: "",
      startDate: "",
      dueDate: "",
    })
    setErrors({})
    setOpen(false)
  }

  const handleTeamChange = async (teamId: string) => {
    setFormData((prev) => ({ ...prev, teamId, assigneeId: "" }))
    setMembers([])
    if (!teamId) return

    setIsLoadingMembers(true)
    try {
      setMembers(await getTeamMembers(teamId))
    } catch {
      setMembers([])
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleDateChange = (
    field: "startDate" | "dueDate",
    value: string
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      return {
        ...next,
        priority:
          calculateTaskPriorityByDates(next.startDate, next.dueDate) ??
          next.priority,
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task to track work and progress. Fill in the details
            below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.root ? (
            <p className="text-sm text-destructive">{errors.root}</p>
          ) : null}
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about the task..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          {/* Task Status and Category - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
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
            </div>

            {/* Task Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select value={formData.teamId} onValueChange={handleTeamChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teamId && (
                <p className="text-sm text-red-500">{errors.teamId}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee *</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assigneeId: value }))
                }
                disabled={!formData.teamId || isLoadingMembers}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingMembers ? "Loading..." : "Select assignee"} />
                </SelectTrigger>
                <SelectContent>
                  {assignableMembers.map((member) => (
                    <SelectItem key={member.uid} value={member.uid}>
                      {member.displayName} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.teamId && !isLoadingMembers && assignableMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This team has no Leader or Vice Leader available for assignment.
                </p>
              ) : null}
              {errors.assigneeId && (
                <p className="text-sm text-red-500">{errors.assigneeId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleDateChange("dueDate", e.target.value)}
                className={errors.dueDate ? "border-red-500" : ""}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Task Priority - Half Width on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={autoPriority} disabled>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center">{priority.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {durationDays === null
                  ? "Priority is calculated after selecting dates."
                  : `${durationDays} day(s) from start date to due date.`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
