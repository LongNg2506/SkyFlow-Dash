"use client"

import { useCallback, useEffect } from "react"
import { toast } from "sonner"

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification-services"
import { useNotificationStore } from "../stores/notification-store"

export function useNotifications(userId: string | null) {
  const {
    notifications,
    unreadCount,
    loading,
    initialized,
    recipientId,
    setNotifications,
    resetForRecipient,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setLoading,
  } = useNotificationStore()

  useEffect(() => {
    resetForRecipient(userId)
  }, [userId, resetForRecipient])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getNotifications(userId)
      setNotifications(userId, data)
    } catch {
      toast.error("Failed to load notifications.")
    } finally {
      setLoading(false)
    }
  }, [userId, setNotifications, setLoading])

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      markAsRead(notificationId)
      try {
        await markNotificationAsRead(notificationId)
      } catch {
        toast.error("Failed to mark as read.")
      }
    },
    [markAsRead]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (!userId) return
    markAllAsRead()
    try {
      await markAllNotificationsAsRead(userId)
    } catch {
      toast.error("Failed to mark all as read.")
    }
  }, [userId, markAllAsRead])

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      removeNotification(notificationId)
      try {
        await deleteNotification(notificationId)
      } catch {
        toast.error("Failed to delete notification.")
      }
    },
    [removeNotification]
  )

  return {
    notifications,
    unreadCount,
    loading,
    initialized,
    recipientId,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
  }
}
