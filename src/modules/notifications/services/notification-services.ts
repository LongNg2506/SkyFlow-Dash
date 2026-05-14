import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { getFirestoreCollection } from "@/lib/firebase/firestore-query"
import { calculateTaskDaysLeft } from "@/modules/tasks/services/task-services"
import type { Task } from "@/modules/tasks/services/types/task-types"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"
import { notificationMockData } from "./notification-mock-data"
import type {
  Notification,
  NotificationType,
} from "./types/notification-types"

const NOTIFICATIONS_COLLECTION = "notifications"

export async function getNotifications(recipientId: string): Promise<Notification[]> {
  const all = await getFirestoreCollection<Notification>(
    NOTIFICATIONS_COLLECTION,
    notificationMockData
  )
  return all
    .filter((n) => n.recipientId === recipientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function seedNotificationsWithClient(): Promise<Notification[]> {
  const batch = writeBatch(getDb())

  notificationMockData.forEach((n) => {
    batch.set(
      doc(getDb(), NOTIFICATIONS_COLLECTION, n.id),
      n,
      { merge: true }
    )
  })

  await batch.commit()
  return notificationMockData
}

export async function createNotification(
  notification: Omit<Notification, "id" | "createdAt">
): Promise<Notification> {
  const id = `NOTIF-${Date.now()}`
  const now = new Date().toISOString()
  const newNotification: Notification = {
    ...notification,
    id,
    createdAt: now,
  }
  await setDoc(
    doc(getDb(), NOTIFICATIONS_COLLECTION, id),
    newNotification
  )
  return newNotification
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(getDb(), NOTIFICATIONS_COLLECTION, notificationId), {
    read: true,
  })
}

export async function markAllNotificationsAsRead(recipientId: string): Promise<void> {
  try {
    const q = query(
      collection(getDb(), NOTIFICATIONS_COLLECTION),
      where("recipientId", "==", recipientId),
      where("read", "==", false)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return

    const batch = writeBatch(getDb())
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true })
    })
    await batch.commit()
  } catch {
    const all = await getFirestoreCollection<Notification>(
      NOTIFICATIONS_COLLECTION,
      []
    )
    const unread = all.filter(
      (n) => n.recipientId === recipientId && !n.read
    )
    const batch = writeBatch(getDb())
    unread.forEach((n) => {
      batch.update(doc(getDb(), NOTIFICATIONS_COLLECTION, n.id), { read: true })
    })
    await batch.commit()
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(getDb(), NOTIFICATIONS_COLLECTION, notificationId))
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const all = await getFirestoreCollection<Notification>(
    NOTIFICATIONS_COLLECTION,
    notificationMockData
  )
  return all.filter((n) => n.recipientId === recipientId && !n.read).length
}

// --- Trigger helpers ---

export async function notifyTaskAssigned(
  task: Task,
  assigneeId: string,
  assigneeName: string,
  senderId: string,
  senderName: string
): Promise<void> {
  await createNotification({
    type: "task_assigned",
    title: "New task assigned",
    message: `${senderName} assigned you to '${task.title}'`,
    taskId: task.id,
    taskTitle: task.title,
    senderId,
    senderName,
    recipientId: assigneeId,
    read: false,
  })
}

export async function notifyTaskDueSoon(
  task: Task,
  recipientId: string,
  daysLeft: number
): Promise<void> {
  await createNotification({
    type: "task_due_soon",
    title: "Task due soon",
    message: `'${task.title}' is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    taskId: task.id,
    taskTitle: task.title,
    recipientId,
    read: false,
  })
}

export async function notifyTaskOverdue(
  task: Task,
  recipientId: string
): Promise<void> {
  await createNotification({
    type: "task_overdue",
    title: "Task overdue",
    message: `'${task.title}' is overdue`,
    taskId: task.id,
    taskTitle: task.title,
    recipientId,
    read: false,
  })
}

export async function notifyTaskStatusChanged(
  task: Task,
  oldStatus: string,
  newStatus: string,
  senderId: string,
  senderName: string,
  recipientIds: string[]
): Promise<void> {
  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      backlog: "Backlog",
      todo: "To Do",
      in_progress: "In Progress",
      review: "Review",
      done: "Done",
      cancelled: "Cancelled",
    }
    return map[s] ?? s
  }

  const notifications = recipientIds.map((rid) => ({
    type: "task_status_changed" as NotificationType,
    title: "Task status updated",
    message: `'${task.title}' changed from ${statusLabel(oldStatus)} to ${statusLabel(newStatus)}`,
    taskId: task.id,
    taskTitle: task.title,
    senderId,
    senderName,
    recipientId: rid,
    read: false,
  }))

  const batch = writeBatch(getDb())
  notifications.forEach((n) => {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2)}`
    batch.set(doc(getDb(), NOTIFICATIONS_COLLECTION, id), { ...n, id, createdAt: new Date().toISOString() })
  })
  await batch.commit()
}

export async function notifyCommentAdded(
  task: Task,
  commentAuthorId: string,
  commentAuthorName: string,
  recipientId: string,
  commentText: string
): Promise<void> {
  await createNotification({
    type: "comment_added",
    title: "New comment",
    message: `${commentAuthorName} commented on '${task.title}': '${commentText.slice(0, 80)}${commentText.length > 80 ? "..." : ""}'`,
    taskId: task.id,
    taskTitle: task.title,
    senderId: commentAuthorId,
    senderName: commentAuthorName,
    recipientId,
    read: false,
  })
}

export async function notifyMention(
  task: Task,
  mentionedUserId: string,
  mentionerId: string,
  mentionerName: string
): Promise<void> {
  await createNotification({
    type: "mention",
    title: "You were mentioned",
    message: `@${mentionerName} in '${task.title}'`,
    taskId: task.id,
    taskTitle: task.title,
    senderId: mentionerId,
    senderName: mentionerName,
    recipientId: mentionedUserId,
    read: false,
  })
}

export async function notifyMeetingInvited(
  meeting: Meeting,
  senderId: string,
  senderName: string
): Promise<Notification[]> {
  const recipients = Array.from(
    new Map(meeting.attendees.map((attendee) => [attendee.uid, attendee])).values()
  ).filter((attendee) => attendee.uid)

  if (recipients.length === 0) return []

  const now = new Date().toISOString()
  const batch = writeBatch(getDb())
  const notifications: Notification[] = recipients.map((attendee) => {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2)}`

    return {
      id,
      type: "meeting_invited" satisfies NotificationType,
      title: "Meeting invitation",
      message: `${senderName} invited you to '${meeting.title}'`,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      senderId,
      senderName,
      recipientId: attendee.uid,
      read: false,
      createdAt: now,
    }
  })

  notifications.forEach((notification) => {
    batch.set(doc(getDb(), NOTIFICATIONS_COLLECTION, notification.id), notification)
  })

  await batch.commit()
  return notifications
}

// Check overdue/due-soon tasks and send notifications
export async function checkTaskDeadlines(
  tasks: Task[],
  userId: string
): Promise<void> {
  const today = new Date()
  const batch = writeBatch(getDb())
  let batchCount = 0

  for (const task of tasks) {
    if (task.assigneeId !== userId) continue
    if (task.status === "done" || task.status === "cancelled") continue
    if (!task.dueDate) continue

    const daysLeft = calculateTaskDaysLeft(task.dueDate, today)
    if (daysLeft === null) continue

    if (daysLeft < 0) {
      const id = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2)}`
      batch.set(doc(getDb(), NOTIFICATIONS_COLLECTION, id), {
        type: "task_overdue",
        title: "Task overdue",
        message: `'${task.title}' is overdue`,
        taskId: task.id,
        taskTitle: task.title,
        recipientId: userId,
        read: false,
        createdAt: today.toISOString(),
      })
      batchCount++
    } else if (daysLeft <= 3 && daysLeft >= 0) {
      const id = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2)}`
      batch.set(doc(getDb(), NOTIFICATIONS_COLLECTION, id), {
        type: "task_due_soon",
        title: "Task due soon",
        message: `'${task.title}' is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        taskId: task.id,
        taskTitle: task.title,
        recipientId: userId,
        read: false,
        createdAt: today.toISOString(),
      })
      batchCount++
    }

    if (batchCount >= 450) {
      await batch.commit()
      batchCount = 0
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }
}
