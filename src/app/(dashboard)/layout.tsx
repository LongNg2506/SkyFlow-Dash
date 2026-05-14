"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile";
import { MeetingReminderPopup } from "@/modules/meetings/components/meeting-reminder-popup";
import { ProtectedRoute } from "@/components/protected-route";

function NotificationBellWrapper() {
  const { profile } = useCurrentUserProfile()
  const userId = profile?.uid ?? null
  const {
    notifications,
    unreadCount,
    loading,
    initialized,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId)

  React.useEffect(() => {
    if (userId && !initialized) fetchNotifications()
  }, [userId, initialized, fetchNotifications])

  if (!userId) return null

  return (
    <NotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={deleteNotification}
      onRefresh={fetchNotifications}
    />
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const { config } = useSidebarConfig();
  const { profile } = useCurrentUserProfile();

  return (
    <ProtectedRoute>
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset>
            <SiteHeader
              onThemeCustomizerOpen={() => setThemeCustomizerOpen(true)}
              notificationsSlot={<NotificationBellWrapper />}
            />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset>
            <SiteHeader
              onThemeCustomizerOpen={() => setThemeCustomizerOpen(true)}
              notificationsSlot={<NotificationBellWrapper />}
            />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
      <MeetingReminderPopup currentUser={profile} />
    </SidebarProvider>
    </ProtectedRoute>
  );
}
