"use client"

import * as React from "react"
import { BellRing, CalendarClock, Check, Clock, X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getMeetings,
  updateMeeting,
} from "@/modules/meetings/services/meeting-services"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"

interface MeetingReminderPopupProps {
  currentUser: CurrentUserProfile | null
}

export function MeetingReminderPopup({ currentUser }: MeetingReminderPopupProps) {
  const [meeting, setMeeting] = React.useState<Meeting | null>(null)
  const [isResponding, setIsResponding] = React.useState(false)
  const userId = currentUser?.uid ?? null

  React.useEffect(() => {
    if (!userId) {
      setMeeting(null)
      return
    }

    let cancelled = false
    const activeUserId = userId

    async function checkMeetings() {
      const meetings = await getMeetings().catch(() => [])
      if (cancelled) return

      const now = Date.now()
      const dueMeeting = meetings
        .filter((candidate) =>
          shouldShowMeetingReminder(candidate, activeUserId, now)
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0]

      if (dueMeeting) {
        localStorage.setItem(getReminderKey(activeUserId, dueMeeting), "shown")
        setMeeting(dueMeeting)
      }
    }

    checkMeetings()
    const interval = window.setInterval(checkMeetings, 30_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [userId])

  React.useEffect(() => {
    if (!meeting) return

    const timeout = window.setTimeout(() => setMeeting(null), 15_000)
    return () => window.clearTimeout(timeout)
  }, [meeting])

  async function handleResponse(status: "accepted" | "declined") {
    if (!meeting || !userId) return

    const attendeeExists = meeting.attendees.some(
      (attendee) => attendee.uid === userId
    )

    if (!attendeeExists) {
      setMeeting(null)
      return
    }

    try {
      setIsResponding(true)
      const updatedMeeting = {
        ...meeting,
        attendees: meeting.attendees.map((attendee) =>
          attendee.uid === userId ? { ...attendee, status } : attendee
        ),
      }
      await updateMeeting(updatedMeeting)
      setMeeting(null)
    } finally {
      setIsResponding(false)
    }
  }

  if (!meeting) return null

  const meetingDate = new Date(meeting.date)
  const canRespond = Boolean(
    userId && meeting.attendees.some((attendee) => attendee.uid === userId)
  )
  const teamNames = meeting.teamNames?.length
    ? meeting.teamNames
    : meeting.teamName
      ? [meeting.teamName]
      : []

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-[80] w-[min(calc(100vw-2rem),24rem)]",
        "animate-meeting-reminder-in"
      )}
    >
      <div className="relative overflow-hidden rounded-lg border bg-popover p-4 text-popover-foreground shadow-2xl ring-1 ring-primary/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary animate-meeting-reminder-progress" />
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground animate-meeting-reminder-pulse">
            <BellRing className="h-5 w-5 animate-meeting-bell-shake" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Meeting time
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
                  {meeting.title}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setMeeting(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                {format(meetingDate, "PP")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(meetingDate, "p")}
              </span>
            </div>

            {teamNames.length > 0 ? (
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {teamNames.join(", ")}
              </p>
            ) : null}

            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 flex-1 cursor-pointer"
                disabled={isResponding}
                onClick={() => handleResponse("accepted")}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Accept
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 cursor-pointer"
                disabled={isResponding}
                onClick={() => {
                  if (canRespond) {
                    handleResponse("declined")
                  } else {
                    setMeeting(null)
                  }
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function isUserMeeting(meeting: Meeting, userId: string) {
  if (meeting.organizerId === userId) return true
  return meeting.attendees.some((attendee) => attendee.uid === userId)
}

function shouldShowMeetingReminder(
  meeting: Meeting,
  userId: string,
  now: number
) {
  if (!isUserMeeting(meeting, userId)) return false

  const startsAt = new Date(meeting.date).getTime()
  if (Number.isNaN(startsAt)) return false

  const durationMinutes = Math.max(meeting.duration ?? 30, 15)
  const endsAt = startsAt + durationMinutes * 60_000
  const reminderKey = getReminderKey(userId, meeting)

  return (
    now >= startsAt &&
    now <= endsAt &&
    !localStorage.getItem(reminderKey)
  )
}

function getReminderKey(userId: string, meeting: Meeting) {
  return `meeting-reminder:${userId}:${meeting.id}:${meeting.date}`
}
