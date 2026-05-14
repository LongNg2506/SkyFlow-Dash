import { z } from "zod"

export const notificationTypeSchema = z.enum([
  "task_assigned",
  "task_due_soon",
  "task_overdue",
  "task_status_changed",
  "comment_added",
  "mention",
  "meeting_invited",
])

export type NotificationType = z.infer<typeof notificationTypeSchema>

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  meetingId: z.string().optional(),
  meetingTitle: z.string().optional(),
  senderId: z.string().optional(),
  senderName: z.string().optional(),
  recipientId: z.string(),
  read: z.boolean().default(false),
  createdAt: z.string(),
})

export type Notification = z.infer<typeof notificationSchema>

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: "Task Assigned",
  task_due_soon: "Due Soon",
  task_overdue: "Overdue",
  task_status_changed: "Status Changed",
  comment_added: "Comment Added",
  mention: "Mention",
  meeting_invited: "Meeting Invite",
}
