"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { Loader2 } from "lucide-react"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentUser } from "@/modules/teams/hooks/use-teams"
import { createTeam } from "@/modules/teams/services/team-services"
import { createTeamSchema, type CreateTeamValues } from "@/modules/teams/services/types/team-types"

export default function CreateTeamPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useCurrentUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      maxMembers: 100,
    },
  })

  const onSubmit = useCallback(
    async (values: CreateTeamValues) => {
      if (!user) {
        toast.error("Bạn cần đăng nhập để tạo team.")
        return
      }

      setIsSubmitting(true)
      try {
        const team = await createTeam(values, {
          uid: user.uid,
          displayName: user.displayName ?? user.email ?? "Unknown",
          email: user.email ?? "",
        })
        toast.success(`Team "${team.name}" đã được tạo!`)
        router.push(`/teams/${team.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tạo team thất bại.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [user, router]
  )

  if (userLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Bạn cần đăng nhập để tạo team.
            </p>
            <Button asChild className="mt-4 cursor-pointer">
              <a href="/sign-in">Đăng nhập</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tạo Team mới</h1>
        <p className="text-muted-foreground mt-1">
          Điền thông tin bên dưới để tạo một team mới. Bạn sẽ tự động trở thành Leader của team này.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin Team</CardTitle>
          <CardDescription>
            Tên team và mô tả sẽ hiển thị cho các thành viên khác.
          </CardDescription>
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
                      <Input placeholder="VD: Frontend Team" {...field} />
                    </FormControl>
                    <FormDescription>Tên team phải có từ 2 đến 50 ký tự.</FormDescription>
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
                      <Input
                        placeholder="VD: Phụ trách giao diện người dùng"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Mô tả ngắn gọn về mục đích của team.</FormDescription>
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
                    <FormDescription>Giới hạn mềm về số lượng thành viên trong team.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="cursor-pointer"
                >
                  Huỷ
                </Button>
                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo Team"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
