"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Database } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { TeamDataTable } from "@/modules/teams/components/data-table"
import { getTeamColumns } from "@/modules/teams/components/columns"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import {
  addMemberToTeam,
  getAvailableUsersForTeam,
  getTeams,
  getMemberCount,
  getTeamMembers,
  seedTeamsWithClient,
} from "@/modules/teams/services/team-services"
import type { TeamRole, TeamWithMemberCount } from "@/modules/teams/services/types/team-types"
import type { User } from "@/modules/users/services/types/user-types"

export default function TeamsPage() {
  const { profile: user, loading: userLoading } = useCurrentUserProfile()
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMemberCount | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserUid, setSelectedUserUid] = useState("")
  const [selectedRole, setSelectedRole] = useState<TeamRole>("Member")
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [uniqueMemberCount, setUniqueMemberCount] = useState(0)
  const canManageAllTeams = user?.systemRole === "Admin" || user?.systemRole === "Manager"

  const canManageTeam = useCallback(
    (team: TeamWithMemberCount) => {
      if (canManageAllTeams) return true
      return Boolean(
        user?.teamRoles.some(
          (teamRole) =>
            teamRole.teamId === team.id &&
            (teamRole.role === "Leader" || teamRole.role === "Vice Leader")
        )
      )
    },
    [canManageAllTeams, user?.teamRoles]
  )

  const loadTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const allTeams = await getTeams()
      const teamsWithCount = await Promise.all(
        allTeams.map(async (team) => {
          const count = await getMemberCount(team.id)
          return {
            ...team,
            memberCount: count,
          } as TeamWithMemberCount
        })
      )
      const teamMembers = await Promise.all(
        allTeams.map((team) => getTeamMembers(team.id).catch(() => []))
      )
      const uniqueMemberIds = new Set(
        teamMembers.flat().map((member) => member.uid)
      )
      setTeams(teamsWithCount)
      setUniqueMemberCount(uniqueMemberIds.size)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách team."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userLoading) {
      loadTeams()
    }
  }, [userLoading, loadTeams])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedTeamsWithClient()
      await loadTeams()
      toast.success("Đã seed dữ liệu thành công!")
    } catch {
      toast.error("Seed dữ liệu thất bại.")
    } finally {
      setSeeding(false)
    }
  }

  const openAddMember = useCallback(async (team: TeamWithMemberCount) => {
    if (!canManageTeam(team)) {
      toast.error("You do not have permission to add members to this team.")
      return
    }
    setSelectedTeam(team)
    setSelectedUserUid("")
    setSelectedRole("Member")
    setLoadingUsers(true)
    try {
      setAvailableUsers(await getAvailableUsersForTeam(team.id))
    } catch (err) {
      setAvailableUsers([])
      toast.error(err instanceof Error ? err.message : "Could not load users.")
    } finally {
      setLoadingUsers(false)
    }
  }, [canManageTeam])

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserUid) return
    const selectedUser = availableUsers.find((item) => item.uid === selectedUserUid)
    if (!selectedUser) return

    setAddingMember(true)
    try {
      await addMemberToTeam(selectedTeam.id, {
        uid: selectedUser.uid,
        displayName: selectedUser.displayName,
        email: selectedUser.email,
        role: selectedRole,
      })
      toast.success("Member added.")
      setSelectedTeam(null)
      await loadTeams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member.")
    } finally {
      setAddingMember(false)
    }
  }

  const columns = useMemo(
    () =>
      getTeamColumns({
        onAddMember: openAddMember,
        canAddMember: canManageTeam,
        canManageTeam,
      }),
    [canManageTeam, openAddMember]
  )

  if (userLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          Quản lý các nhóm làm việc trong hệ thống.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.filter((t) => t.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng thành viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueMemberCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {canManageAllTeams ? (
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/teams/create">
            <Plus className="mr-2 size-4" />
            Tạo Team mới
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeed}
          disabled={seeding}
        >
          {seeding ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Database className="mr-2 size-4" />
          )}
          Seed dữ liệu
        </Button>
      </div>
      ) : null}

      {/* Error */}
      {error && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <TeamDataTable
        columns={columns}
        data={teams}
        searchPlaceholder="Tìm kiếm team..."
      />

      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Add a regular user to {selectedTeam?.name}. Users already assigned to any team are hidden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={selectedUserUid}
                onValueChange={setSelectedUserUid}
                disabled={loadingUsers || availableUsers.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((availableUser) => (
                    <SelectItem key={availableUser.uid} value={availableUser.uid}>
                      {availableUser.displayName} - {availableUser.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loadingUsers && availableUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No available users. Each user can belong to one team only.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Role</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as TeamRole)}>
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
          </div>
          <DialogFooter className="gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedTeam(null)}
              disabled={addingMember}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addingMember || !selectedUserUid}
              className="cursor-pointer"
            >
              {addingMember ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
