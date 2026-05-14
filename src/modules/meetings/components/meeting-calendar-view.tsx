"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, isPast, isToday } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"

interface MeetingCalendarViewProps {
  meetings: Meeting[]
  onSelectMeeting?: (meeting: Meeting) => void
}

export function MeetingCalendarView({ meetings, onSelectMeeting }: MeetingCalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const meetingsByDate = React.useMemo(() => {
    const map = new Map<string, Meeting[]>()
    for (const meeting of meetings) {
      const key = format(new Date(meeting.date), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(meeting)
    }
    return map
  }, [meetings])

  const selectedMeetings = React.useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, "yyyy-MM-dd")
    return meetingsByDate.get(key) ?? []
  }, [selectedDate, meetingsByDate])

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  return (
    <div className="flex gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={prevMonth} className="cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs cursor-pointer">
              Today
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={nextMonth} className="cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayMeetings = meetingsByDate.get(dateKey) ?? []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)
            const isPastDate = isPast(day) && !isTodayDate

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative min-h-[72px] rounded-md border p-1.5 text-left transition-colors cursor-pointer hover:bg-muted/50",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "ring-2 ring-primary bg-primary/5",
                  isTodayDate && !isSelected && "border-primary/50"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isTodayDate && "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center",
                    isPastDate && "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Meeting dots */}
                {dayMeetings.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayMeetings.slice(0, 2).map((meeting) => (
                      <div
                        key={meeting.id}
                        className={cn(
                          "text-[9px] truncate rounded px-1 py-0.5 leading-tight",
                          isPastDate
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {format(new Date(meeting.date), "HH:mm")} {meeting.title}
                      </div>
                    ))}
                    {dayMeetings.length > 2 && (
                      <div className="text-[9px] text-muted-foreground pl-1">
                        +{dayMeetings.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <div className="w-72 border-l pl-6 hidden md:block">
        <h3 className="text-sm font-semibold mb-3">
          {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
        </h3>
        {selectedDate ? (
          selectedMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedMeetings.map((meeting) => {
                const teamNames = getMeetingTeamNames(meeting)

                return (
                  <div
                    key={meeting.id}
                    className="rounded-md border p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onSelectMeeting?.(meeting)}
                  >
                    <div className="text-sm font-medium line-clamp-1">{meeting.title}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(meeting.date), "p")} · {meeting.duration} min
                    </div>
                    {teamNames.slice(0, 2).map((teamName) => (
                      <Badge key={teamName} variant="secondary" className="text-[10px] h-4 mt-1 mr-1">
                        {teamName}
                      </Badge>
                    ))}
                    {teamNames.length > 2 ? (
                      <Badge variant="outline" className="text-[10px] h-4 mt-1">
                        +{teamNames.length - 2}
                      </Badge>
                    ) : null}
                    {meeting.actionItems.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 mt-1 ml-1">
                        {meeting.actionItems.filter((a) => a.completed).length}/{meeting.actionItems.length} actions
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            Click a date to see meetings.
          </p>
        )}
      </div>
    </div>
  )
}

function getMeetingTeamNames(meeting: Meeting) {
  if (meeting.teamNames?.length) return meeting.teamNames
  return meeting.teamName ? [meeting.teamName] : []
}
