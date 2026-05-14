"use client"

import * as React from "react"
import { MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TeamMember, TeamRole } from "../services/types/team-types"

interface MemberActionsProps {
  member: TeamMember
  currentUserUid: string
  currentUserRole: TeamRole
  onChangeRole: (uid: string, role: TeamRole) => Promise<void>
  onRemove: (uid: string) => Promise<void>
}

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] = [
  { value: "Leader", label: "Leader", description: "Team lead with full permissions" },
  { value: "Vice Leader", label: "Vice Leader", description: "Assists the leader and manages members" },
  { value: "Member", label: "Member", description: "Team contributor" },
]

export function MemberActions({
  member,
  currentUserUid,
  currentUserRole,
  onChangeRole,
  onRemove,
}: MemberActionsProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [roleOpen, setRoleOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<TeamRole>(member.role)
  const [isRemoving, setIsRemoving] = React.useState(false)
  const [isSavingRole, setIsSavingRole] = React.useState(false)

  const isSelf = member.uid === currentUserUid
  const isLeader = member.role === "Leader"
  const isMember = member.role === "Member"

  const canChangeRole =
    !isSelf &&
    ((currentUserRole === "Leader" && !isLeader) ||
      (currentUserRole === "Vice Leader" && isMember))

  const canRemove =
    !isSelf &&
    ((currentUserRole === "Leader" && !isLeader) ||
      (currentUserRole === "Vice Leader" && isMember))

  if (!canChangeRole && !canRemove) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          {canChangeRole ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setRoleOpen(true)}>
              <ShieldCheck className="mr-2 size-4" />
              Change role
            </DropdownMenuItem>
          ) : null}
          {canRemove ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Remove from team
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change <strong>{member.displayName}</strong>'s role in this team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button
              variant="outline"
              onClick={() => setRoleOpen(false)}
              disabled={isSavingRole}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (selectedRole === member.role) {
                  setRoleOpen(false)
                  return
                }
                setIsSavingRole(true)
                try {
                  await onChangeRole(member.uid, selectedRole)
                  setRoleOpen(false)
                } finally {
                  setIsSavingRole(false)
                }
              }}
              disabled={isSavingRole || selectedRole === member.role}
              className="cursor-pointer"
            >
              {isSavingRole ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              Remove <strong>{member.displayName}</strong> from this team. The user account will remain in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isRemoving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsRemoving(true)
                try {
                  await onRemove(member.uid)
                  setDeleteOpen(false)
                } finally {
                  setIsRemoving(false)
                }
              }}
              disabled={isRemoving}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 size-4" />
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
