"use client"

import { useCallback, useEffect, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import {
  addMemberToTeam,
  getAvailableUsersForTeam,
  getTeamById,
  getTeamMembers,
  getUserRoleInTeam,
  isLastLeader,
  removeMemberFromTeam,
  updateMemberRole,
} from "@/modules/teams/services/team-services"
import { MembersTable } from "@/modules/teams/components/members-table"
import type { Team, TeamMember, TeamRole } from "@/modules/teams/services/types/team-types"
import type { User } from "@/modules/users/services/types/user-types"

export default function TeamMembersPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const { profile: user, loading: userLoading } = useCurrentUserProfile()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserUid, setSelectedUserUid] = useState("")
  const [addRole, setAddRole] = useState<TeamRole>("Member")
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [teamData, membersData] = await Promise.all([
        getTeamById(teamId),
        getTeamMembers(teamId),
      ])
      const role = user ? await getUserRoleInTeam(teamId, user.uid) : null
      setTeam(teamData)
      setMembers(membersData)
      setCurrentUserRole(role)
    } catch {
      toast.error("Could not load team members.")
    } finally {
      setLoading(false)
    }
  }, [teamId, user])

  useEffect(() => {
    if (!userLoading) load()
  }, [userLoading, load])

  async function openAddMember() {
    setAddOpen(true)
    setSelectedUserUid("")
    try {
      setAvailableUsers(await getAvailableUsersForTeam(teamId))
    } catch {
      setAvailableUsers([])
      toast.error("Could not load available users.")
    }
  }

  async function handleAddMember() {
    if (!selectedUserUid) {
      toast.error("Please select a user.")
      return
    }

    const selectedUser = availableUsers.find((item) => item.uid === selectedUserUid)
    if (!selectedUser) return

    setIsAdding(true)
    try {
      await addMemberToTeam(teamId, {
        uid: selectedUser.uid,
        displayName: selectedUser.displayName,
        email: selectedUser.email,
        role: addRole,
      })
      toast.success("Member added.")
      setAddOpen(false)
      setSelectedUserUid("")
      setAddRole("Member")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member.")
    } finally {
      setIsAdding(false)
    }
  }

  async function handleChangeRole(uid: string, role: TeamRole) {
    try {
      await updateMemberRole(teamId, uid, role)
      toast.success("Role updated.")
      await load()
    } catch {
      toast.error("Failed to update role.")
    }
  }

  async function handleRemoveMember(uid: string) {
    try {
      const member = members.find((item) => item.uid === uid)
      if (member?.role === "Leader" && (await isLastLeader(teamId))) {
        toast.error("Cannot remove the last Leader of a team.")
        return
      }
      await removeMemberFromTeam(teamId, uid)
      toast.success("Member removed from team.")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member.")
    }
  }

  if (loading || userLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!team) notFound()

  const canManageAllTeams = user?.systemRole === "Admin" || user?.systemRole === "Manager"
  const canManage =
    canManageAllTeams ||
    currentUserRole === "Leader" ||
    currentUserRole === "Vice Leader"
  if (!canManage) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              You do not have permission to manage this team's members.
            </p>
            <Button
              variant="outline"
              className="mt-4 cursor-pointer"
              onClick={() => router.push(`/teams/${teamId}`)}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/teams/${teamId}`)}
            className="cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Members</h1>
            <p className="text-muted-foreground">
              Team: <strong>{team.name}</strong>
            </p>
          </div>
        </div>
        <Button onClick={openAddMember} className="cursor-pointer">
          <Plus className="mr-2 size-4" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} members / {team.maxMembers} max
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={members}
            currentUserUid={user?.uid ?? ""}
            currentUserRole={canManageAllTeams ? "Leader" : currentUserRole ?? "Member"}
            onChangeRole={handleChangeRole}
            onRemove={handleRemoveMember}
          />
        </CardContent>
      </Card>

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Member</CardTitle>
              <CardDescription>
                Select a regular user. Users already assigned to another team are hidden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUserUid} onValueChange={setSelectedUserUid}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((availableUser) => (
                      <SelectItem key={availableUser.uid} value={availableUser.uid}>
                        {availableUser.displayName} - {availableUser.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={addRole} onValueChange={(value) => setAddRole(value as TeamRole)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Leader", "Vice Leader", "Member"] as TeamRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                  disabled={isAdding}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={isAdding || !selectedUserUid}
                  className="cursor-pointer"
                >
                  {isAdding ? "Adding..." : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
