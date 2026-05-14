"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { onAuthStateChanged, updateEmail, updateProfile, type User as FirebaseUser } from "firebase/auth"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/firebase/client"
import {
  ensureUserProfileFromAuth,
  getUsers,
  updateUser,
} from "@/modules/users/services/user-services"
import type { User } from "@/modules/users/services/types/user-types"

const accountFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

export default function AccountSettings() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    let cancelled = false

    async function loadProfile(user: FirebaseUser | null) {
      setLoading(true)
      try {
        const users = await getUsers()
        const matchedProfile =
          users.find((item) => item.uid === user?.uid) ??
          users.find((item) => item.email === user?.email) ??
          (!user ? users.find((item) => item.systemRole === "Admin") : null) ??
          null
        const ensuredProfile = user
          ? await ensureUserProfileFromAuth({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            })
          : matchedProfile

        if (cancelled) return

        const displayName = ensuredProfile?.displayName ?? user?.displayName ?? ""
        const [firstName = "", ...rest] = displayName.split(" ")
        const lastName = rest.join(" ")
        setFirebaseUser(user)
        setProfile(ensuredProfile)
        form.reset({
          firstName,
          lastName,
          email: ensuredProfile?.email ?? user?.email ?? "",
          username: ensuredProfile?.name ?? ensuredProfile?.email?.split("@")[0] ?? "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load account.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (!auth) {
      loadProfile(null)
      return () => {
        cancelled = true
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      loadProfile(user)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [form])

  async function onSubmit(data: AccountFormValues) {
    if (data.newPassword || data.confirmPassword || data.currentPassword) {
      toast.error("Password changes require re-authentication and are not enabled here yet.")
      return
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error("New password and confirm password do not match.")
      return
    }

    const displayName = `${data.firstName} ${data.lastName}`.trim()
    setSaving(true)
    try {
      if (firebaseUser) {
        if (firebaseUser.displayName !== displayName) {
          await updateProfile(firebaseUser, { displayName })
        }
        if (firebaseUser.email && firebaseUser.email !== data.email) {
          await updateEmail(firebaseUser, data.email)
        }
      }

      const baseProfile =
        profile ??
        (firebaseUser
          ? await ensureUserProfileFromAuth({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            })
          : null)

      if (!baseProfile) {
        throw new Error("No account profile found.")
      }

      const updatedProfile: User = {
        ...baseProfile,
        displayName,
        email: data.email,
        name: data.username,
        updatedAt: new Date().toISOString(),
      }

      await updateUser(updatedProfile)
      setProfile(updatedProfile)
      toast.success("Account settings saved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save account settings.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information that will be displayed on your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <Button variant="destructive" type="button" className="cursor-pointer">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-2">
              <Button type="submit" className="cursor-pointer" disabled={loading || saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" type="reset" className="cursor-pointer">Cancel</Button>
            </div>
          </form>
        </Form>
      </div>
  )
}
