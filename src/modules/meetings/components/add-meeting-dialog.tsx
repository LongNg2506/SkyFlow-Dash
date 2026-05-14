"use client"

import * as React from "react"
import { Calendar, Check, Clock, Plus, Search, X } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"
import {
  getTeams,
  getUserTeamMemberships,
} from "@/modules/teams/services/team-services"
import { getUsers } from "@/modules/users/services/user-services"
import type { Team } from "@/modules/teams/services/types/team-types"
import type { User } from "@/modules/users/services/types/user-types"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import { format } from "date-fns"

type AttendeeSelection = {
  uid: string
  displayName: string
  email?: string
  status: "pending"
}

type UserTeamRoleLabel = {
  teamName: string
  role: "Leader" | "Vice Leader" | "Member"
}

const meetingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.number().min(15).max(480),
  teamIds: z.array(z.string()).default([]),
  organizerName: z.string().min(1, "Organizer is required"),
  notes: z.string().optional(),
})

type MeetingFormData = z.infer<typeof meetingFormSchema>

interface AddMeetingDialogProps {
  onAddMeeting?: (meeting: Meeting) => void | Promise<void>
  teams?: Team[]
  users?: User[]
  currentUser?: CurrentUserProfile | null
  trigger?: React.ReactNode
}

export function AddMeetingDialog({
  onAddMeeting,
  teams = [],
  users = [],
  currentUser,
  trigger,
}: AddMeetingDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<MeetingFormData>({
    title: "",
    description: "",
    date: "",
    time: "09:00",
    duration: 60,
    teamIds: [],
    organizerName: "",
    notes: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const [timePickerOpen, setTimePickerOpen] = React.useState(false)
  const [allUsers, setAllUsers] = React.useState<User[]>(users)
  const [allTeams, setAllTeams] = React.useState<Team[]>(teams)
  const [userTeamRoles, setUserTeamRoles] = React.useState<
    Record<string, UserTeamRoleLabel[]>
  >({})
  const [attendeeQuery, setAttendeeQuery] = React.useState("")
  const [selectedAttendees, setSelectedAttendees] = React.useState<AttendeeSelection[]>([])

  React.useEffect(() => {
    if (open) {
      Promise.all([getTeams(), getUsers(), getUserTeamMemberships()]).then(([t, u, memberships]) => {
        setAllTeams(t)
        setAllUsers(u)
        setUserTeamRoles(groupMembershipsByUser(memberships))
      })
    }
  }, [open])

  function generateMeetingId() {
    return `MTG-${Date.now()}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const validated = meetingFormSchema.parse(formData)
      const selectedTeams = allTeams.filter((team) =>
        validated.teamIds.includes(team.id)
      )
      const permissionError = validateMeetingCreatePermission(
        currentUser,
        selectedTeams
      )

      if (permissionError) {
        setErrors({ permission: permissionError })
        return
      }

      const now = new Date().toISOString()
      const meetingDate = combineDateAndTime(validated.date, validated.time)

      const meeting: Meeting = {
        id: generateMeetingId(),
        title: validated.title,
        description: validated.description ?? "",
        date: meetingDate,
        duration: validated.duration,
        teamId: selectedTeams[0]?.id ?? "",
        teamName: selectedTeams[0]?.name ?? "",
        teamIds: selectedTeams.map((team) => team.id),
        teamNames: selectedTeams.map((team) => team.name),
        organizerId: currentUser?.uid ?? "",
        organizerName: validated.organizerName,
        attendees: selectedAttendees.map((a) => ({ ...a, status: "pending" as const })),
        notes: validated.notes ?? "",
        decisions: [],
        actionItems: [],
        createdAt: now,
        updatedAt: now,
      }

      await onAddMeeting?.(meeting)

      setFormData({
        title: "",
        description: "",
        date: "",
        time: "09:00",
        duration: 60,
        teamIds: [],
        organizerName: "",
        notes: "",
      })
      setSelectedAttendees([])
      setAttendeeQuery("")
      setErrors({})
      setOpen(false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message
          }
        })
        setErrors(newErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleAttendee(user: User) {
    setSelectedAttendees((prev) => {
      const exists = prev.find((a) => a.uid === user.uid)
      if (exists) return prev.filter((a) => a.uid !== user.uid)
      return [
        ...prev,
        { uid: user.uid, displayName: user.displayName ?? user.email ?? user.uid, email: user.email, status: "pending" as const },
      ]
    })
  }

  function removeAttendee(uid: string) {
    setSelectedAttendees((prev) => prev.filter((attendee) => attendee.uid !== uid))
  }

  function toggleTeam(teamId: string) {
    setFormData((prev) => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId)
        ? prev.teamIds.filter((id) => id !== teamId)
        : [...prev.teamIds, teamId],
    }))
  }

  const selectedDate = formData.date ? parseDateKey(formData.date) : undefined
  const selectedTeams = allTeams.filter((team) => formData.teamIds.includes(team.id))
  const filteredUsers = React.useMemo(() => {
    const query = attendeeQuery.trim().toLowerCase()
    if (!query) return []

    return allUsers
      .filter((user) => !selectedAttendees.some((attendee) => attendee.uid === user.uid))
      .filter((user) => {
        const name = user.displayName?.toLowerCase() ?? ""
        const email = user.email?.toLowerCase() ?? ""
        return name.includes(query) || email.includes(query)
      })
      .slice(0, 8)
  }, [allUsers, attendeeQuery, selectedAttendees])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" size="sm" className="cursor-pointer">
            <Plus className="w-4 h-4" />
            New Meeting
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.permission && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {errors.permission}
            </p>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Meeting title..."
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Meeting agenda and goals..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Date + Time + Duration */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal cursor-pointer",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((p) => ({ ...p, date: toDateKey(date) }))
                        setDatePickerOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="time"
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal cursor-pointer",
                      errors.time && "border-red-500"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatTimeLabel(formData.time)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <CustomTimePicker
                    value={formData.time}
                    onChange={(time) => setFormData((p) => ({ ...p, time }))}
                  />
                </PopoverContent>
              </Popover>
              {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={String(formData.duration)}
                onValueChange={(v) => setFormData((p) => ({ ...p, duration: Number(v) }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <SelectItem key={d} value={String(d)} className="cursor-pointer">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {d < 60 ? `${d} min` : `${d / 60} hr${d > 60 ? "s" : ""}`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teams + Organizer */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Teams</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal cursor-pointer",
                      selectedTeams.length === 0 && "text-muted-foreground"
                    )}
                  >
                    {selectedTeams.length === 0
                      ? "Select teams"
                      : `${selectedTeams.length} team${selectedTeams.length !== 1 ? "s" : ""} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                  {allTeams.map((team) => {
                    const selected = formData.teamIds.includes(team.id)
                      const canSelectTeam = canCreateMeetingForTeam(currentUser, team.id)
                      return (
                        <button
                          key={team.id}
                          type="button"
                          disabled={!canSelectTeam}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                            selected && "bg-muted",
                            !canSelectTeam && "cursor-not-allowed opacity-50"
                          )}
                          onClick={() => toggleTeam(team.id)}
                        >
                          <span className="truncate">{team.name}</span>
                          {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                        </button>
                      )
                    })}
                    {allTeams.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        No teams available.
                      </p>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedTeams.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTeams.map((team) => (
                    <span
                      key={team.id}
                      className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                    >
                      {team.name}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => toggleTeam(team.id)}
                        aria-label={`Remove ${team.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer">Organizer *</Label>
              <Select
                value={formData.organizerName}
                onValueChange={(v) => setFormData((p) => ({ ...p, organizerName: v }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select organizer" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user) => (
                    <SelectItem key={user.uid} value={user.displayName ?? user.email ?? ""} className="cursor-pointer">
                      {user.displayName ?? user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organizerName && <p className="text-sm text-red-500">{errors.organizerName}</p>}
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label>Attendees</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={attendeeQuery}
                onChange={(e) => setAttendeeQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
              {attendeeQuery.trim() ? (
                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No users found.
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.uid}
                        type="button"
                        className="flex w-full flex-col gap-1 rounded-sm px-3 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          toggleAttendee(user)
                          setAttendeeQuery("")
                        }}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <span className="truncate">
                            {user.displayName ?? user.email ?? user.uid}
                          </span>
                          <UserRoleBadges roles={userTeamRoles[user.uid]} />
                        </span>
                        {user.email ? (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAttendees.map((attendee) => (
                  <span
                    key={attendee.uid}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  >
                    {attendee.displayName}
                    <UserRoleBadges roles={userTeamRoles[attendee.uid]} compact />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => removeAttendee(attendee.uid)}
                      aria-label={`Remove ${attendee.displayName}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Meeting Notes</Label>
            <Textarea
              id="notes"
              placeholder="Key points discussed..."
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? "Creating..." : "Create Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined

  return new Date(year, month - 1, day)
}

function combineDateAndTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  return new Date(
    year,
    month - 1,
    day,
    hours || 0,
    minutes || 0,
    0,
    0
  ).toISOString()
}

function CustomTimePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const parsed = parseTimeValue(value)
  const hours = Array.from({ length: 12 }, (_, index) => index + 1)
  const minutes = Array.from({ length: 60 }, (_, index) => index)

  function updateTime(next: Partial<typeof parsed>) {
    const merged = { ...parsed, ...next }
    onChange(toTwentyFourHourTime(merged.hour, merged.minute, merged.period))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_4rem] gap-2">
        <TimeColumn label="Hour">
          {hours.map((hour) => (
            <TimeOption
              key={hour}
              selected={parsed.hour === hour}
              onClick={() => updateTime({ hour })}
            >
              {String(hour).padStart(2, "0")}
            </TimeOption>
          ))}
        </TimeColumn>

        <TimeColumn label="Minute">
          {minutes.map((minute) => (
            <TimeOption
              key={minute}
              selected={parsed.minute === minute}
              onClick={() => updateTime({ minute })}
            >
              {String(minute).padStart(2, "0")}
            </TimeOption>
          ))}
        </TimeColumn>

        <TimeColumn label="Period">
          {(["AM", "PM"] as const).map((period) => (
            <TimeOption
              key={period}
              selected={parsed.period === period}
              onClick={() => updateTime({ period })}
            >
              {period}
            </TimeOption>
          ))}
        </TimeColumn>
      </div>
      <div className="rounded-md bg-muted px-3 py-2 text-center text-sm font-medium">
        {formatTimeLabel(value)}
      </div>
    </div>
  )
}

function TimeColumn({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="px-1 text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
        {children}
      </div>
    </div>
  )
}

function TimeOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8 w-full items-center justify-center rounded-sm text-sm transition-colors hover:bg-muted",
        selected && "bg-primary text-primary-foreground hover:bg-primary"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function parseTimeValue(value: string) {
  const [rawHour, rawMinute] = value.split(":").map(Number)
  const hour24 = Number.isFinite(rawHour) ? rawHour : 9
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0
  const period = hour24 >= 12 ? "PM" : "AM"
  const hour = hour24 % 12 || 12

  return {
    hour,
    minute: Math.min(59, Math.max(0, minute)),
    period: period as "AM" | "PM",
  }
}

function toTwentyFourHourTime(
  hour: number,
  minute: number,
  period: "AM" | "PM"
) {
  const normalizedHour =
    period === "AM"
      ? hour === 12
        ? 0
        : hour
      : hour === 12
        ? 12
        : hour + 12

  return `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function formatTimeLabel(value: string) {
  const parsed = parseTimeValue(value)
  return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${parsed.period}`
}

function groupMembershipsByUser(
  memberships: Array<{
    uid: string
    teamName: string
    role: "Leader" | "Vice Leader" | "Member"
  }>
) {
  return memberships.reduce<Record<string, UserTeamRoleLabel[]>>(
    (grouped, membership) => {
      const current = grouped[membership.uid] ?? []
      grouped[membership.uid] = [
        ...current,
        {
          teamName: membership.teamName,
          role: membership.role,
        },
      ]
      return grouped
    },
    {}
  )
}

function UserRoleBadges({
  roles,
  compact = false,
}: {
  roles?: UserTeamRoleLabel[]
  compact?: boolean
}) {
  if (!roles?.length) return null

  const sortedRoles = [...roles].sort(
    (a, b) => getRoleWeight(a.role) - getRoleWeight(b.role)
  )
  const visibleRoles = sortedRoles.slice(0, compact ? 1 : 2)
  const remainingCount = sortedRoles.length - visibleRoles.length

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {visibleRoles.map((role) => (
        <span
          key={`${role.teamName}-${role.role}`}
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
            getRoleBadgeClass(role.role)
          )}
          title={`${role.teamName} - ${role.role}`}
        >
          {compact ? role.role : `${role.role} · ${role.teamName}`}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="text-[10px] text-muted-foreground">+{remainingCount}</span>
      ) : null}
    </span>
  )
}

function getRoleWeight(role: UserTeamRoleLabel["role"]) {
  if (role === "Leader") return 0
  if (role === "Vice Leader") return 1
  return 2
}

function getRoleBadgeClass(role: UserTeamRoleLabel["role"]) {
  if (role === "Leader") {
    return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
  }
  if (role === "Vice Leader") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
}

function canCreateMeetingForTeam(
  currentUser: CurrentUserProfile | null | undefined,
  _teamId: string
) {
  if (!currentUser) return false
  if (currentUser.systemRole === "Admin" || currentUser.systemRole === "Manager") {
    return true
  }

  return currentUser.teamRoles.some((teamRole) => teamRole.role === "Leader")
}

function validateMeetingCreatePermission(
  currentUser: CurrentUserProfile | null | undefined,
  selectedTeams: Team[]
) {
  if (!currentUser) {
    return "You must be signed in to create meetings."
  }

  if (currentUser.systemRole === "Admin" || currentUser.systemRole === "Manager") {
    return null
  }

  if (!currentUser.teamRoles.some((teamRole) => teamRole.role === "Leader")) {
    return "Only Admin, Manager, or team Leader can create meetings."
  }

  if (selectedTeams.length === 0) {
    return "Team Leader must select at least one team they lead."
  }

  const canCreateForSelection = selectedTeams.some((team) =>
    currentUser.teamRoles.some(
      (teamRole) => teamRole.teamId === team.id && teamRole.role === "Leader"
    )
  )

  return canCreateForSelection
    ? null
    : "Team Leader can only create meetings for teams they lead."
}
