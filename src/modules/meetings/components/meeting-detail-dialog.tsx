"use client"

import * as React from "react"
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { format } from "date-fns"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Meeting } from "@/modules/meetings/services/types/meeting-types"

interface MeetingDetailDialogProps {
  meeting: Meeting | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateMeeting?: (meeting: Meeting) => void | Promise<void>
  onDeleteMeeting?: (meetingId: string) => void | Promise<void>
  currentUserId?: string
}

export function MeetingDetailDialog({
  meeting,
  open,
  onOpenChange,
  onUpdateMeeting,
  onDeleteMeeting,
  currentUserId,
}: MeetingDetailDialogProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [notes, setNotes] = React.useState("")
  const [newDecision, setNewDecision] = React.useState("")
  const [newActionTitle, setNewActionTitle] = React.useState("")
  const [newActionAssignee, setNewActionAssignee] = React.useState("")
  const [showActionForm, setShowActionForm] = React.useState(false)

  React.useEffect(() => {
    if (meeting) {
      setNotes(meeting.notes ?? "")
      setIsEditing(false)
      setNewDecision("")
      setNewActionTitle("")
      setNewActionAssignee("")
      setShowActionForm(false)
    }
  }, [meeting])

  if (!meeting) return null

  const m = meeting as Meeting // guaranteed non-null after early return
  const meetingDate = new Date(m.date)
  const completedActions = m.actionItems.filter((a) => a.completed).length
  const teamNames = getMeetingTeamNames(m)

  async function handleSaveNotes() {
    if (!onUpdateMeeting) return
    await onUpdateMeeting({ ...m, notes })
    setIsEditing(false)
  }

  async function handleAddDecision() {
    if (!newDecision.trim() || !onUpdateMeeting) return
    await onUpdateMeeting({
      ...m,
      decisions: [...m.decisions, newDecision.trim()],
    })
    setNewDecision("")
  }

  async function handleRemoveDecision(index: number) {
    if (!onUpdateMeeting) return
    await onUpdateMeeting({
      ...m,
      decisions: m.decisions.filter((_, i) => i !== index),
    })
  }

  async function handleAddAction() {
    if (!newActionTitle.trim() || !onUpdateMeeting) return
    const newAction = {
      id: `AI-${Date.now()}`,
      title: newActionTitle.trim(),
      assigneeId: newActionAssignee || undefined,
      assigneeName: newActionAssignee || undefined,
      completed: false,
    }
    await onUpdateMeeting({
      ...m,
      actionItems: [...m.actionItems, newAction],
    })
    setNewActionTitle("")
    setNewActionAssignee("")
    setShowActionForm(false)
  }

  async function handleToggleAction(actionId: string) {
    if (!onUpdateMeeting) return
    await onUpdateMeeting({
      ...m,
      actionItems: m.actionItems.map((a) =>
        a.id === actionId ? { ...a, completed: !a.completed } : a
      ),
    })
  }

  async function handleRemoveAction(actionId: string) {
    if (!onUpdateMeeting) return
    await onUpdateMeeting({
      ...m,
      actionItems: m.actionItems.filter((a) => a.id !== actionId),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="leading-snug text-left">{m.title}</DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              {onDeleteMeeting && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(meetingDate, "PPP")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(meetingDate, "p")} · {m.duration} min
            </div>
            {teamNames.map((teamName) => (
              <Badge key={teamName} variant="secondary" className="text-[11px] h-5">
                {teamName}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {m.description && (
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {m.description}
              </p>
            </div>
          )}

          {/* Attendees */}
          {m.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Attendees ({m.attendees.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.attendees.map((a) => (
                  <div
                    key={a.uid}
                    className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {a.displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{a.displayName}</span>
                    {a.status === "accepted" && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    {a.status === "declined" && (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Meeting Notes
              </span>
              {!isEditing && onUpdateMeeting && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add meeting notes..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes} className="cursor-pointer">
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setIsEditing(false); setNotes(m.notes ?? "") }}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 min-h-[60px]">
                {m.notes || "No notes recorded."}
              </p>
            )}
          </div>

          {/* Decisions */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Decisions ({m.decisions.length})
              </span>
            </div>
            {m.decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions recorded.</p>
            ) : (
              <ul className="space-y-1.5">
                {m.decisions.map((decision, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="flex-1 leading-relaxed">{decision}</span>
                    {onUpdateMeeting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => handleRemoveDecision(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {onUpdateMeeting && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a decision..."
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDecision()}
                />
                <Button size="sm" className="h-8 cursor-pointer" onClick={handleAddDecision}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Action Items ({completedActions}/{m.actionItems.length})
              </span>
              {onUpdateMeeting && !showActionForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs cursor-pointer"
                  onClick={() => setShowActionForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {m.actionItems.length === 0 && !showActionForm ? (
              <p className="text-sm text-muted-foreground">No action items.</p>
            ) : (
              <ul className="space-y-1.5">
                {m.actionItems.map((action) => (
                  <li
                    key={action.id}
                    className={cn(
                      "flex items-center gap-2 text-sm rounded-md p-2",
                      action.completed && "bg-muted/30"
                    )}
                  >
                    <button
                      type="button"
                      className="shrink-0 cursor-pointer"
                      onClick={() => handleToggleAction(action.id)}
                    >
                      {action.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "flex-1 leading-relaxed",
                        action.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {action.title}
                    </span>
                    {action.assigneeName && (
                      <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                        {action.assigneeName}
                      </Badge>
                    )}
                    {onUpdateMeeting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                        onClick={() => handleRemoveAction(action.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {showActionForm && (
              <div className="mt-2 space-y-2 bg-muted/30 rounded-md p-3">
                <Input
                  placeholder="Action item title..."
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  className="text-sm h-8"
                />
                <Input
                  placeholder="Assignee name (optional)"
                  value={newActionAssignee}
                  onChange={(e) => setNewActionAssignee(e.target.value)}
                  className="text-sm h-8"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 cursor-pointer" onClick={handleAddAction}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 cursor-pointer"
                    onClick={() => {
                      setShowActionForm(false)
                      setNewActionTitle("")
                      setNewActionAssignee("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete meeting?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>&quot;{m.title}&quot;</strong>? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleting(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await onDeleteMeeting?.(meeting.id)
                setIsDeleting(false)
                onOpenChange(false)
              }}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

function getMeetingTeamNames(meeting: Meeting) {
  if (meeting.teamNames?.length) return meeting.teamNames
  return meeting.teamName ? [meeting.teamName] : []
}
