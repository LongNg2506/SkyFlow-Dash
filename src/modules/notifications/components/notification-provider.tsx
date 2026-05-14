"use client"

import * as React from "react"
import { NotificationBell } from "@/modules/notifications/components/notification-bell"
import { useNotifications } from "@/modules/notifications/hooks/useNotifications"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { profile } = useCurrentUserProfile()
  const userId = profile?.uid ?? null

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId)

  React.useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId, fetchNotifications])

  return (
    <>
      {children}
      {userId && (
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onRefresh={fetchNotifications}
        />
      )}
    </>
  )
}
