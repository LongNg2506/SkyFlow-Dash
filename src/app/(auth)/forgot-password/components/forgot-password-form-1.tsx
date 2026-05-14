"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { sendResetPasswordEmail } from "@/lib/firebase/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await sendResetPasswordEmail(email)
      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại."
      // Firebase-specific error messages
      if (msg.includes("user-not-found") || msg.includes("INVALID_EMAIL")) {
        setError("Email này chưa được đăng ký.")
      } else if (msg.includes("too-many-requests")) {
        setError("Quá nhiều yêu cầu. Vui lòng đợi vài phút rồi thử lại.")
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Quên mật khẩu?</CardTitle>
          <CardDescription>
            Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-12 text-green-500" />
              <div>
                <p className="font-semibold text-green-600">Đã gửi email!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kiểm tra hộp thư <strong>{email}</strong> và click vào link trong email để đặt mật khẩu mới.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Nếu không thấy email, kiểm tra thư mục Spam.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2 w-full cursor-pointer"
                onClick={() => { setSent(false); setEmail("") }}
              >
                Gửi lại email khác
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vietlong2506.korea@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi link đặt lại mật khẩu"
                  )}
                </Button>
                <div className="text-center text-sm">
                  Nhớ mật khẩu?{" "}
                  <a href="/sign-in" className="underline underline-offset-4">
                    Quay lại đăng nhập
                  </a>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
