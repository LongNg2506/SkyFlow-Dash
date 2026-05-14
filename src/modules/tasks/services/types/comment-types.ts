import { z } from "zod"

export const commentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  mentions: z.array(z.string()).default([]),
  createdAt: z.string(),
})

export type Comment = z.infer<typeof commentSchema>
