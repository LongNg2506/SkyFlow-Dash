import { z } from "zod"

export const meetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  duration: z.number().optional(), // minutes
  teamId: z.string().optional(),
  teamName: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  teamNames: z.array(z.string()).default([]),
  organizerId: z.string(),
  organizerName: z.string(),
  attendees: z
    .array(
      z.object({
        uid: z.string(),
        displayName: z.string(),
        email: z.string().optional(),
        status: z.enum(["pending", "accepted", "declined"]).default("pending"),
      })
    )
    .default([]),
  notes: z.string().optional(),
  decisions: z.array(z.string()).default([]),
  actionItems: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        assigneeId: z.string().optional(),
        assigneeName: z.string().optional(),
        dueDate: z.string().optional(),
        completed: z.boolean().default(false),
      })
    )
    .default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Meeting = z.infer<typeof meetingSchema>
