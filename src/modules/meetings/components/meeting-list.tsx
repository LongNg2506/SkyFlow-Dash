"use client"

import * as React from "react"
import { Calendar, CheckCircle2, Circle, Clock, Users } from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"

interface MeetingListProps {
  meetings: Meeting[]
  onSelectMeeting?: (meeting: Meeting) => void
}

export function MeetingList({ meetings, onSelectMeeting }: MeetingListProps) {
  const sorted = React.useMemo(
    () =>
      [...meetings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [meetings]
  )

  const upcomingMeetings = sorted.filter((m) => !isPast(new Date(m.date)))
  const pastMeetings = sorted.filter((m) => isPast(new Date(m.date)))

  if (meetings.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {upcomingMeetings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Upcoming ({upcomingMeetings.length})
          </h3>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onClick={() => onSelectMeeting?.(meeting)}
              />
            ))}
          </div>
        </div>
      )}

      {pastMeetings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Past ({pastMeetings.length})
          </h3>
          <div className="space-y-3">
            {pastMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onClick={() => onSelectMeeting?.(meeting)}
                variant="past"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MeetingCardProps {
  meeting: Meeting
  onClick?: () => void
  variant?: "default" | "past"
}

function MeetingCard({ meeting, onClick, variant = "default" }: MeetingCardProps) {
  const meetingDate = new Date(meeting.date)
  const isOverdue = isPast(meetingDate)
  const completedActions = meeting.actionItems.filter((a) => a.completed).length
  const totalActions = meeting.actionItems.length
  const teamNames = getMeetingTeamNames(meeting)

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        variant === "past" && "opacity-70"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium leading-snug line-clamp-1">
              {meeting.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3" />
              {format(meetingDate, "PPP")}
              <span className="text-muted-foreground">·</span>
              <Clock className="h-3 w-3" />
              {format(meetingDate, "p")}
              <span className="text-muted-foreground">·</span>
              {meeting.duration} min
            </CardDescription>
          </div>
          {isOverdue && variant !== "past" ? (
            <Badge variant="destructive" className="text-[10px] shrink-0">
              Overdue
            </Badge>
          ) : totalActions > 0 ? (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {completedActions}/{totalActions} actions
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1 space-y-2">
        {meeting.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {meeting.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex -space-x-1.5">
              {meeting.attendees.slice(0, 4).map((a) => (
                <Avatar key={a.uid} className="h-5 w-5 border border-background">
                  <AvatarFallback className="text-[9px]">
                    {a.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {meeting.attendees.length > 4 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-muted text-[9px] font-medium">
                  +{meeting.attendees.length - 4}
                </span>
              )}
            </div>
          </div>
          {teamNames.length > 0 && (
            <span className="max-w-[180px] truncate text-[11px] text-muted-foreground">
              {teamNames.join(", ")}
            </span>
          )}
        </div>
        {meeting.decisions.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {meeting.decisions.length} decision{meeting.decisions.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getMeetingTeamNames(meeting: Meeting) {
  if (meeting.teamNames?.length) return meeting.teamNames
  return meeting.teamName ? [meeting.teamName] : []
}
