"use client"

import { useCallback, useEffect, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCurrentUser } from "@/modules/teams/hooks/use-teams"
import {
  getTeamById,
  getUserRoleInTeam,
  updateTeam,
  deactivateTeam,
  deleteTeam,
} from "@/modules/teams/services/team-services"
import { editTeamSchema, type EditTeamValues } from "@/modules/teams/services/types/team-types"
import type { TeamRole } from "@/modules/teams/services/types/team-types"

export default function EditTeamPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const { user, loading: userLoading } = useCurrentUser()
  const [team, setTeam] = useState<Awaited<ReturnType<typeof getTeamById>>>(null)
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<EditTeamValues>({
    resolver: zodResolver(editTeamSchema),
    values: team
      ? {
          name: team.name,
          description: team.description,
          maxMembers: team.maxMembers,
          isActive: team.isActive,
        }
      : undefined,
  })

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        const [teamData, role] = await Promise.all([
          getTeamById(teamId),
          getUserRoleInTeam(teamId, user.uid),
        ])
        setTeam(teamData)
        setCurrentUserRole(role)
      } catch {
        toast.error("Không thể tải thông tin team.")
      } finally {
        setLoading(false)
      }
    }
    if (!userLoading) load()
  }, [teamId, user, userLoading])

  const onSubmit = useCallback(
    async (values: EditTeamValues) => {
      setSubmitting(true)
      try {
        await updateTeam(teamId, values)
        toast.success("Cập nhật team thành công!")
        router.push(`/teams/${teamId}`)
      } catch {
        toast.error("Cập nhật thất bại.")
      } finally {
        setSubmitting(false)
      }
    },
    [teamId, router]
  )

  const handleDeactivate = async () => {
    setDeleting(true)
    try {
      await deactivateTeam(teamId)
      toast.success("Team đã được deactive.")
      setDeactivateOpen(false)
      router.push(`/teams/${teamId}`)
    } catch {
      toast.error("Thao tác thất bại.")
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteTeam(teamId)
      toast.success("Team đã được xóa.")
      router.push("/teams")
    } catch {
      toast.error("Xóa team thất bại.")
    } finally {
      setDeleting(false)
    }
  }

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

  const canEdit = currentUserRole === "Leader" || currentUserRole === "Vice Leader"
  const isLeader = currentUserRole === "Leader"

  if (!canEdit) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Bạn không có quyền chỉnh sửa team này.
            </p>
            <Button
              variant="outline"
              className="mt-4 cursor-pointer"
              onClick={() => router.push(`/teams/${teamId}`)}
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa Team</h1>
        <p className="text-muted-foreground mt-1">Cập nhật thông tin team.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin Team</CardTitle>
          <CardDescription>Only Leader and Vice Leader can edit this team.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Team</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số thành viên tối đa</FormLabel>
                    <FormControl>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 25, 50, 100, 200, 500].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} thành viên
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Team hoạt động</FormLabel>
                      <FormDescription>
                        Tắt nếu muốn tạm ngưng team này.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/teams/${teamId}`)}
                  className="cursor-pointer"
                >
                  Huỷ
                </Button>
                <Button type="submit" disabled={submitting} className="cursor-pointer">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Leader Actions */}
      {isLeader && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Nguy hiểm</CardTitle>
            <CardDescription>
              Các thao tác dưới đây không thể hoàn tác.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Deactive Team</p>
                <p className="text-sm text-muted-foreground">
                  Tạm ngưng team. Có thể kích hoạt lại sau.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivateOpen(true)}
                className="cursor-pointer border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400"
              >
                Deactive
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Xóa Team vĩnh viễn</p>
                <p className="text-sm text-muted-foreground">
                  Xóa toàn bộ team và dữ liệu thành viên.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                <Trash2 className="mr-2 size-4" />
                Xóa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deactivate Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactive team?</DialogTitle>
            <DialogDescription>
              Team sẽ bị tạm ngưng. Bạn có thể kích hoạt lại sau.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={deleting} className="cursor-pointer">
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? "Đang xử lý..." : "Deactive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xóa team vĩnh viễn?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ thông tin team và thành viên sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting} className="cursor-pointer">
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 size-4" />
              {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
