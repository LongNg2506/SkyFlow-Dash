import { create } from "zustand"
import type { Notification } from "../services/types/notification-types"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  initialized: boolean
  recipientId: string | null

  setNotifications: (recipientId: string, notifications: Notification[]) => void
  resetForRecipient: (recipientId: string | null) => void
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  initialized: false,
  recipientId: null,

  setNotifications: (recipientId, notifications) =>
    set({
      recipientId,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      initialized: true,
    }),

  resetForRecipient: (recipientId) =>
    set((state) =>
      state.recipientId === recipientId
        ? state
        : {
            recipientId,
            notifications: [],
            unreadCount: 0,
            loading: false,
            initialized: false,
          }
    ),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),

  markAsRead: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (notificationId) =>
    set((state) => {
      const removed = state.notifications.find((n) => n.id === notificationId)
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount:
          state.unreadCount - (removed && !removed.read ? 1 : 0),
      }
    }),

  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}))
