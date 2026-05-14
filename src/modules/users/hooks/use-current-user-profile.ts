"use client"

import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, query, where } from "firebase/firestore"
import { doc, getDoc } from "firebase/firestore"

import { auth, getDb } from "@/lib/firebase/client"
import type { SystemRole } from "@/modules/users/services/types/user-types"

export interface CurrentUserProfile {
  uid: string
  email: string | null
  displayName: string | null
  systemRole: SystemRole
  teams: string[]
  teamRoles: Array<{ teamId: string; role: "Leader" | "Vice Leader" | "Member" }>
}

const profileCache = new Map<string, CurrentUserProfile>()
const profilePromises = new Map<string, Promise<CurrentUserProfile>>()
const teamRoleCache = new Map<
  string,
  Array<{ teamId: string; role: "Leader" | "Vice Leader" | "Member" }>
>()

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(() => {
    const uid = auth?.currentUser?.uid
    return uid ? profileCache.get(uid) ?? null : null
  })
  const [loading, setLoading] = useState(true)

  const fetchTeamRolesFromUserTeams = useCallback(async (uid: string) => {
    const cached = teamRoleCache.get(uid)
    if (cached) return cached

    try {
      const snapshot = await getDocs(
        query(
          collection(getDb(), "userTeams"),
          where("uid", "==", uid),
          where("isActive", "==", true)
        )
      )
      const roles = snapshot.docs.map((d) => {
        const data = d.data()
        return {
          teamId: data.teamId as string,
          role: data.role as "Leader" | "Vice Leader" | "Member",
        }
      })
      teamRoleCache.set(uid, roles)
      return roles
    } catch {
      return []
    }
  }, [])

  const fetchProfile = useCallback(
    async (uid: string) => {
      const cached = profileCache.get(uid)
      if (cached) return cached

      const pending = profilePromises.get(uid)
      if (pending) return pending

      const promise = (async () => {
        let systemRole: SystemRole = "User"
        let teams: string[] = []
        let teamRoles: Array<{ teamId: string; role: "Leader" | "Vice Leader" | "Member" }> = []

        try {
          const userDoc = await getDoc(doc(getDb(), "users", uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            systemRole = (data.systemRole as SystemRole) ?? "User"
            teams = data.teams ?? []
            teamRoles = data.teamRoles ?? []
          }
        } catch {
          // Firebase not configured or user doc not found
        }

        // If teamRoles not in user doc, fetch from userTeams collection
        if (teamRoles.length === 0) {
          teamRoles = await fetchTeamRolesFromUserTeams(uid)
        }

        const profile = {
          uid,
          email: null,
          displayName: null,
          systemRole,
          teams,
          teamRoles,
        } satisfies CurrentUserProfile

        profileCache.set(uid, profile)
        return profile
      })()

      profilePromises.set(uid, promise)
      try {
        return await promise
      } finally {
        profilePromises.delete(uid)
      }
    },
    [fetchTeamRolesFromUserTeams]
  )

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await fetchProfile(firebaseUser.uid)
        const nextProfile = {
          ...userProfile,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }
        profileCache.set(firebaseUser.uid, nextProfile)
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [fetchProfile])

  return { profile, loading: loading && !profile }
}
