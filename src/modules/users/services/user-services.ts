import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db, getDb } from "@/lib/firebase/client"

import { userMockData } from "./user-mock-data"
import type { User, UserFormValues, UserWithStats } from "./types/user-types"
import type { Task } from "@/modules/tasks/services/types/task-types"

let usersCache: User[] | null = null
let usersPromise: Promise<User[]> | null = null

export async function getUsers(): Promise<User[]> {
  if (usersCache) return usersCache
  if (usersPromise) return usersPromise

  usersPromise = loadUsers()
  try {
    usersCache = await usersPromise
    return usersCache
  } finally {
    usersPromise = null
  }
}

async function loadUsers(): Promise<User[]> {
  if (!db) return enforceProjectRoles(userMockData.map((user) => normalizeUser(user)))

  try {
    const snapshot = await getDocs(collection(db, "users"))

    if (snapshot.empty) return enforceProjectRoles(userMockData.map((user) => normalizeUser(user)))

    return enforceProjectRoles(
      snapshot.docs.map((document) =>
        normalizeUser({ ...(document.data() as Partial<User>), uid: document.id })
      )
    )
  } catch (error) {
    console.warn("Failed to load users from Firestore. Falling back to local mock data.", error)
    return enforceProjectRoles(userMockData.map((user) => normalizeUser(user)))
  }
}

function clearUsersCache() {
  usersCache = null
  usersPromise = null
}

export function generateUserAvatar(name: string) {
  const names = name.split(" ")

  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }

  return name.substring(0, 2).toUpperCase()
}

export function normalizeUser(user: Partial<User>): User {
  const displayName = user.displayName ?? user.name ?? "Unnamed User"
  const email = user.email ?? ""
  const now = new Date().toISOString()

  return {
    ...user,
    uid: String(user.uid ?? user.id ?? `user-${Date.now()}`),
    displayName,
    email,
    photoURL: user.photoURL ?? null,
    systemRole: normalizeSystemRole(user.systemRole ?? user.role),
    status: normalizeStatus(user.status),
    createdAt: user.createdAt ?? user.joinedDate ?? now,
    updatedAt: user.updatedAt ?? user.lastLogin ?? now,
    avatar: user.avatar ?? generateUserAvatar(displayName),
    assignedTasks: user.assignedTasks ?? 0,
  }
}

function normalizeSystemRole(role: unknown): User["systemRole"] {
  if (role === "Admin" || role === "Manager" || role === "User") return role
  if (
    role === "Maintainer" ||
    role === "Editor" ||
    role === "Author"
  ) {
    return "Manager"
  }
  return "User"
}

function enforceProjectRoles(users: User[]): User[] {
  let hasAdmin = false
  let hasManager = false

  return users.map((user) => {
    if (user.systemRole === "Admin") {
      if (!hasAdmin) {
        hasAdmin = true
        return user
      }
      return { ...user, systemRole: "User" }
    }

    if (user.systemRole === "Manager") {
      if (!hasManager) {
        hasManager = true
        return user
      }
      return { ...user, systemRole: "User" }
    }

    return user
  })
}

function normalizeStatus(status: unknown): User["status"] {
  return status === "Active" || status === "Pending" || status === "Inactive"
    ? status
    : "Active"
}

export async function createUser(_users: User[], userData: UserFormValues): Promise<User> {
  if (userData.systemRole === "Admin" && _users.some((user) => user.systemRole === "Admin")) {
    throw new Error("Only one Admin is allowed for this project.")
  }
  if (userData.systemRole === "Manager" && _users.some((user) => user.systemRole === "Manager")) {
    throw new Error("Only one Manager is allowed for this project.")
  }
  const now = new Date().toISOString()
  const uid = `user-${Date.now()}`
  const user: User = {
    uid,
    displayName: userData.displayName,
    email: userData.email,
    photoURL: null,
    systemRole: userData.systemRole,
    status: userData.status,
    createdAt: now,
    updatedAt: now,
    avatar: generateUserAvatar(userData.displayName),
    assignedTasks: 0,
  }

  try {
    await setDoc(doc(getDb(), "users", uid), user, { merge: true })
    clearUsersCache()
  } catch (error) {
    console.warn("Failed to create user in Firestore. Keeping local state only.", error)
  }

  return user
}

export async function ensureUserProfileFromAuth(authUser: {
  uid: string
  email?: string | null
  displayName?: string | null
  photoURL?: string | null
}): Promise<User> {
  const uid = authUser.uid
  const email = authUser.email ?? ""
  const now = new Date().toISOString()
  const ref = doc(getDb(), "users", uid)
  const snapshot = await getDoc(ref)

  if (snapshot.exists()) {
    const existing = normalizeUser({ ...(snapshot.data() as Partial<User>), uid })
    const updated: User = {
      ...existing,
      email: existing.email || email,
      displayName:
        existing.displayName ||
        authUser.displayName ||
        email.split("@")[0] ||
        "Unnamed User",
      photoURL: existing.photoURL ?? authUser.photoURL ?? null,
      updatedAt: now,
    }
    await setDoc(ref, updated, { merge: true })
    clearUsersCache()
    return updated
  }

  const users = await getUsers()
  const existingByEmail = users.find((user) => user.email === email)
  const user: User = {
    uid,
    displayName:
      existingByEmail?.displayName ??
      authUser.displayName ??
      email.split("@")[0] ??
      "Unnamed User",
    email,
    photoURL: authUser.photoURL ?? existingByEmail?.photoURL ?? null,
    systemRole: existingByEmail?.systemRole ?? "User",
    status: "Active",
    createdAt: existingByEmail?.createdAt ?? now,
    updatedAt: now,
    avatar: generateUserAvatar(
      existingByEmail?.displayName ??
        authUser.displayName ??
        email.split("@")[0] ??
        "Unnamed User"
    ),
  }

  await setDoc(ref, user, { merge: true })
  if (existingByEmail?.uid && existingByEmail.uid !== uid) {
    await deleteDoc(doc(getDb(), "users", existingByEmail.uid)).catch(() => undefined)
  }
  clearUsersCache()
  return user
}

export async function updateUser(user: User): Promise<User> {
  const updated = { ...normalizeUser(user), updatedAt: new Date().toISOString() }
  await updateDoc(doc(getDb(), "users", updated.uid), updated)
  clearUsersCache()
  return updated
}

export async function deactivateUser(uid: string): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid), {
    status: "Inactive",
    updatedAt: new Date().toISOString(),
  })
  clearUsersCache()
}

export function buildUsersWithStats(
  users: User[],
  memberships: Array<{ uid: string; teamName: string; role?: string }>,
  tasks: Task[]
): UserWithStats[] {
  return users.map((user) => ({
    ...normalizeUser(user),
    teamNames:
      user.systemRole === "Admin" || user.systemRole === "Manager"
        ? []
        : memberships
            .filter((membership) => membership.uid === user.uid)
            .map((membership) => membership.teamName),
    teamRoles:
      user.systemRole === "Admin" || user.systemRole === "Manager"
        ? []
        : memberships
            .filter((membership) => membership.uid === user.uid)
            .map((membership) => ({
              teamName: membership.teamName,
              role: membership.role ?? "Member",
            })),
    assignedTasks:
      user.systemRole === "Admin" || user.systemRole === "Manager"
        ? 0
        : tasks.filter((task) => task.assigneeId === user.uid).length,
  }))
}
