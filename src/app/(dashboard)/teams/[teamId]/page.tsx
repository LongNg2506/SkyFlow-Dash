"use client"

import { useCallback, useEffect, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { Loader2, Pencil, Settings, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import {
  getTeamById,
  getTeamMembers,
  getMemberCount,
  getUserRoleInTeam,
} from "@/modules/teams/services/team-services"
import type { Team, TeamMember, TeamRole } from "@/modules/teams/services/types/team-types"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const { profile: user, loading: userLoading } = useCurrentUserProfile()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [teamData, membersData, count] = await Promise.all([
        getTeamById(teamId),
        getTeamMembers(teamId),
        getMemberCount(teamId),
      ])
      const role = user ? await getUserRoleInTeam(teamId, user.uid) : null

      if (!teamData) {
        setLoading(false)
        return
      }

      setTeam(teamData)
      setMembers(membersData)
      setMemberCount(count)
      setCurrentUserRole(role)
    } catch {
      toast.error("Không thể tải thông tin team.")
    } finally {
      setLoading(false)
    }
  }, [teamId, user])

  useEffect(() => {
    if (!userLoading) {
      load()
    }
  }, [userLoading, load])

  if (loading || userLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!team) {
    notFound()
  }

  const canManage =
    user?.systemRole === "Admin" ||
    user?.systemRole === "Manager" ||
    currentUserRole === "Leader" ||
    currentUserRole === "Vice Leader"
  const memberRoleStyle: Record<string, string> = {
    Leader: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "Vice Leader": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    Member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <Badge
              variant={team.isActive ? "default" : "secondary"}
              className={
                team.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800"
              }
            >
              {team.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{team.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {memberCount} / {team.maxMembers} thành viên
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <Link href={`/teams/${teamId}/members`}>
                  <Users className="mr-2 size-4" />
                  Quản lý thành viên
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <Link href={`/teams/${teamId}/edit`}>
                  <Pencil className="mr-2 size-4" />
                  Chỉnh sửa
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Team Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tên Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{team.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thành viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {memberCount} / {team.maxMembers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vai trò của bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUserRole ? (
              <Badge className={`${memberRoleStyle[currentUserRole] ?? ""} cursor-default`}>
                {currentUserRole}
              </Badge>
            ) : (
              <p className="text-muted-foreground">Không có trong team</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Danh sách thành viên</h2>
        </div>

        {members.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Chưa có thành viên nào.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-sm">
                  <th className="px-4 py-3 text-left font-medium">Thành viên</th>
                  <th className="px-4 py-3 text-left font-medium">Vai trò</th>
                  <th className="px-4 py-3 text-left font-medium">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.uid} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {member.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{member.displayName}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${memberRoleStyle[member.role] ?? ""} cursor-default`}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
