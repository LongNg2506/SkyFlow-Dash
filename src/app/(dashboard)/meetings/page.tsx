"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarDays, CalendarRange, List, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import { useMeetings } from "@/modules/meetings/hooks/useMeetings"
import {
  createMeeting,
  deleteMeeting,
  getMeetingStats,
  seedMeetingsWithClient,
  updateMeeting,
} from "@/modules/meetings/services/meeting-services"
import { notifyMeetingInvited } from "@/modules/notifications/services/notification-services"
import { useNotificationStore } from "@/modules/notifications/stores/notification-store"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"
import { MeetingList } from "@/modules/meetings/components/meeting-list"
import { MeetingDetailDialog } from "@/modules/meetings/components/meeting-detail-dialog"
import { AddMeetingDialog } from "@/modules/meetings/components/add-meeting-dialog"
import { MeetingCalendarView } from "@/modules/meetings/components/meeting-calendar-view"
import { getTeams } from "@/modules/teams/services/team-services"
import { getUsers } from "@/modules/users/services/user-services"
import type { Team } from "@/modules/teams/services/types/team-types"
import type { User } from "@/modules/users/services/types/user-types"

type ViewMode = "list" | "calendar"

export default function MeetingsPage() {
  const { profile } = useCurrentUserProfile()
  const { meetings, setMeetings, loading, refresh } = useMeetings(profile)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    Promise.all([getTeams(), getUsers()]).then(([t, u]) => {
      setTeams(t)
      setUsers(u)
    })
  }, [])

  const stats = getMeetingStats(meetings)
  const canCreateMeeting = canCreateMeetings(profile)

  const handleAddMeeting = useCallback(
    async (meeting: Meeting) => {
      const permissionError = validateMeetingCreatePermission(profile, meeting)
      if (permissionError) {
        toast.error(permissionError)
        return
      }

      const created = await createMeeting(meeting)
      const notifications = await notifyMeetingInvited(
        created,
        profile?.uid ?? "",
        profile?.displayName || profile?.email || created.organizerName || "Someone"
      )
      const ownNotification = notifications.find(
        (notification) => notification.recipientId === profile?.uid
      )

      if (ownNotification) {
        addNotification(ownNotification)
      }

      setMeetings((prev: Meeting[]) => [...prev, created])
      toast.success("Meeting created.")
    },
    [addNotification, profile, setMeetings]
  )

  const handleUpdateMeeting = useCallback(
    async (meeting: Meeting) => {
      const updated = await updateMeeting(meeting)
      setMeetings((prev: Meeting[]) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      )
      setSelectedMeeting(updated)
      toast.success("Meeting updated.")
    },
    [setMeetings]
  )

  const handleDeleteMeeting = useCallback(
    async (meetingId: string) => {
      await deleteMeeting(meetingId)
      setMeetings((prev: Meeting[]) => prev.filter((m) => m.id !== meetingId))
      setSelectedMeeting(null)
      setDetailOpen(false)
      toast.success("Meeting deleted.")
    },
    [setMeetings]
  )

  const handleSeedMeetings = useCallback(async () => {
    try {
      setIsSeeding(true)
      const seeded = await seedMeetingsWithClient()
      setMeetings(seeded)
      toast.success("Meetings seeded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed meetings.")
    } finally {
      setIsSeeding(false)
    }
  }, [setMeetings])

  function handleSelectMeeting(meeting: Meeting) {
    setSelectedMeeting(meeting)
    setDetailOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading meetings...</div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground">
              Schedule meetings, record decisions, and track action items.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedMeetings}
              disabled={isSeeding}
              className="cursor-pointer"
            >
              {isSeeding ? "Seeding..." : "Seed Data"}
            </Button>
            {canCreateMeeting ? (
              <AddMeetingDialog
                onAddMeeting={handleAddMeeting}
                teams={teams}
                users={users}
                currentUser={profile}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="h-full flex-1 flex-col space-y-6 px-4 md:px-6 md:flex">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total</p>
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <CalendarDays className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Upcoming</p>
                  <span className="text-2xl font-bold">{stats.upcoming}</span>
                </div>
                <CalendarRange className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Past</p>
                  <span className="text-2xl font-bold">{stats.past}</span>
                </div>
                <List className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Action Items</p>
                  <span className="text-2xl font-bold">{stats.withActionItems}</span>
                </div>
                <Plus className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Meetings</CardTitle>
                <CardDescription>
                  Click a meeting to view details, decisions, and action items.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 cursor-pointer px-2"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline text-xs">List</span>
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "calendar" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 cursor-pointer px-2"
                  onClick={() => setViewMode("calendar")}
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline text-xs">Calendar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "list" ? (
              <MeetingList meetings={meetings} onSelectMeeting={handleSelectMeeting} />
            ) : (
              <MeetingCalendarView meetings={meetings} onSelectMeeting={handleSelectMeeting} />
            )}
          </CardContent>
        </Card>
      </div>

      <MeetingDetailDialog
        meeting={selectedMeeting}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdateMeeting={handleUpdateMeeting}
        onDeleteMeeting={handleDeleteMeeting}
        currentUserId={profile?.uid}
      />
    </>
  )
}

function canCreateMeetings(
  profile: ReturnType<typeof useCurrentUserProfile>["profile"]
) {
  if (!profile) return false
  if (profile.systemRole === "Admin" || profile.systemRole === "Manager") {
    return true
  }

  return profile.teamRoles.some((teamRole) => teamRole.role === "Leader")
}

function validateMeetingCreatePermission(
  profile: ReturnType<typeof useCurrentUserProfile>["profile"],
  meeting: Meeting
) {
  if (!profile) {
    return "You must be signed in to create meetings."
  }

  if (profile.systemRole === "Admin" || profile.systemRole === "Manager") {
    return null
  }

  if (!profile.teamRoles.some((teamRole) => teamRole.role === "Leader")) {
    return "Only Admin, Manager, or team Leader can create meetings."
  }

  if (meeting.teamIds.length === 0) {
    return "Team Leader must select at least one team they lead."
  }

  const ownsSelectedTeam = meeting.teamIds.some((teamId) =>
    profile.teamRoles.some(
      (teamRole) => teamRole.teamId === teamId && teamRole.role === "Leader"
    )
  )

  return ownsSelectedTeam
    ? null
    : "Team Leader can only create meetings for teams they lead."
}
