import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  taskCode: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
  teamId: z.string().optional(),
  teamName: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  assigneeEmail: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  doneDate: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Task = z.infer<typeof taskSchema>
