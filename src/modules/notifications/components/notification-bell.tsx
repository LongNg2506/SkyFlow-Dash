"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Circle,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  NOTIFICATION_TYPE_LABELS,
  type Notification,
} from "../services/types/notification-types"

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "task_assigned":
      return <RefreshCw className="size-4 text-blue-500" />
    case "task_due_soon":
      return <AlertTriangle className="size-4 text-orange-500" />
    case "task_overdue":
      return <AlertTriangle className="size-4 text-red-500" />
    case "task_status_changed":
      return <RefreshCw className="size-4 text-purple-500" />
    case "comment_added":
      return <MessageSquare className="size-4 text-green-500" />
    case "mention":
      return <MessageSquarePlus className="size-4 text-amber-500" />
    case "meeting_invited":
      return <CalendarDays className="size-4 text-cyan-500" />
  }
}

function getNotificationColor(type: Notification["type"]) {
  switch (type) {
    case "task_assigned":
      return "bg-blue-500"
    case "task_due_soon":
      return "bg-orange-500"
    case "task_overdue":
      return "bg-red-500"
    case "task_status_changed":
      return "bg-purple-500"
    case "comment_added":
      return "bg-green-500"
    case "mention":
      return "bg-amber-500"
    case "meeting_invited":
      return "bg-cyan-500"
  }
}

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export function NotificationBell({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setOpen((o) => !o)}
          >
            {unreadCount > 0 ? (
              <BellRing className="size-5" />
            ) : (
              <Bell className="size-5" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
        </TooltipContent>
      </Tooltip>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-lg border bg-popover shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4" />
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      onMarkAllAsRead()
                      onRefresh()
                    }}
                  >
                    <CheckCheck className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    onRefresh()
                  }}
                >
                  <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Body */}
            <ScrollArea className="max-h-96">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  asChild
                >
                  <Link href="/settings/notifications" onClick={() => setOpen(false)}>
                    Notification Settings
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: () => void
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: NotificationItemProps) {
  const [hovered, setHovered] = React.useState(false)

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    } catch {
      return ""
    }
  }, [notification.createdAt])

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors",
        !notification.read && "bg-accent/50"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {!notification.read && (
              <Circle className="size-2 fill-blue-500 text-blue-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              notification.read ? "text-muted-foreground" : "text-foreground"
            )}>
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </span>
          </div>
          {hovered && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                >
                  <Check className="size-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(notification.id)
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          )}
        </div>

        <p className={cn(
          "mt-0.5 text-sm",
          notification.read ? "text-muted-foreground" : "text-foreground"
        )}>
          {notification.message}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {notification.taskId && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link
                href={`/tasks?highlight=${notification.taskId}`}
                onClick={onNavigate}
              >
                View task
              </Link>
            </Button>
          )}
          {notification.meetingId && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/meetings" onClick={onNavigate}>
                View meeting
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Unread indicator bar */}
      {!notification.read && (
        <div className={cn("absolute left-0 top-2 bottom-2 w-0.5 rounded-full", getNotificationColor(notification.type))} />
      )}
    </div>
  )
}
