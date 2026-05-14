"use client"

import * as React from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import {
  LayoutPanelLeft,
  LayoutDashboard,
  Megaphone,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  Shield,
  AlertTriangle,
  Settings,
  HelpCircle,
  CreditCard,
  LayoutTemplate,
  Users,
  UsersRound,
  Archive,
  CalendarClock,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { auth } from "@/lib/firebase/client"
import { getUsers } from "@/modules/users/services/user-services"
import type { User as AppUser } from "@/modules/users/services/types/user-types"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navGroups: [
    {
      label: "Dashboard",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard-2",
          icon: LayoutPanelLeft,
        },
      ],
    },
    {
      label: "Apps",
      items: [
        {
          title: "Mail",
          url: "/mail",
          icon: Mail,
        },
        {
          title: "Tasks",
          url: "/tasks",
          icon: CheckSquare,
        },
        {
          title: "Backlog",
          url: "/backlog",
          icon: Archive,
        },
        {
          title: "Meetings",
          url: "/meetings",
          icon: CalendarClock,
        },
        {
          title: "Documents",
          url: "/documents",
          icon: FileText,
        },
        {
          title: "Chat",
          url: "/chat",
          icon: MessageCircle,
        },
        {
          title: "Calendar",
          url: "/calendar",
          icon: Calendar,
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
        },
        {
          title: "Teams",
          url: "/teams",
          icon: UsersRound,
        },
      ],
    },
    {
      label: "Pages",
      items: [
        {
          title: "Landing",
          url: "/landing",
          target: "_blank",
          icon: LayoutTemplate,
        },
        {
          title: "Auth Pages",
          url: "#",
          icon: Shield,
          items: [
            {
              title: "Sign In",
              url: "/sign-in",
            },
            {
              title: "Sign Up",
              url: "/sign-up",
            },
            {
              title: "Forgot Password",
              url: "/forgot-password",
            },
          ],
        },
        {
          title: "Errors",
          url: "#",
          icon: AlertTriangle,
          items: [
            {
              title: "Unauthorized",
              url: "/errors/unauthorized",
            },
            {
              title: "Forbidden",
              url: "/errors/forbidden",
            },
            {
              title: "Not Found",
              url: "/errors/not-found",
            },
            {
              title: "Internal Server Error",
              url: "/errors/internal-server-error",
            },
            {
              title: "Under Maintenance",
              url: "/errors/under-maintenance",
            },
          ],
        },
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "User Settings",
              url: "/settings/user",
            },
            {
              title: "Account Settings",
              url: "/settings/account",
            },
            {
              title: "Plans & Billing",
              url: "/settings/billing",
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
            },
            {
              title: "Connections",
              url: "/settings/connections",
            },
          ],
        },
        {
          title: "FAQs",
          url: "/faqs",
          icon: HelpCircle,
        },
        {
          title: "Pricing",
          url: "/pricing",
          icon: CreditCard,
        },
      ],
    },
  ],
}

function getUserName(user: User | null, profile: AppUser | null) {
  if (profile?.displayName) return profile.displayName
  if (user?.displayName) return user.displayName
  if (profile?.email) return profile.email.split("@")[0]
  if (user?.email) return user.email.split("@")[0]
  return "User"
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = React.useState<AppUser | null>(null)
  const [isAuthReady, setIsAuthReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function loadProfile(firebaseUser: User | null) {
      try {
        const users = await getUsers()
        const profile =
          users.find((item) => item.uid === firebaseUser?.uid) ??
          users.find((item) => item.email && item.email === firebaseUser?.email) ??
          (!firebaseUser ? users.find((item) => item.systemRole === "Admin") : null) ??
          null

        if (!cancelled) setCurrentProfile(profile)
      } catch {
        if (!cancelled) setCurrentProfile(null)
      } finally {
        if (!cancelled) setIsAuthReady(true)
      }
    }

    if (!auth) {
      loadProfile(null)
      return () => {
        cancelled = true
      }
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setIsAuthReady(false)
      loadProfile(user)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const user = {
    name: isAuthReady ? getUserName(currentUser, currentProfile) : "Loading...",
    email: currentProfile?.email ?? currentUser?.email ?? "",
    avatar: currentProfile?.photoURL ?? currentUser?.photoURL ?? "",
    role: currentProfile?.systemRole,
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Claude Code</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
