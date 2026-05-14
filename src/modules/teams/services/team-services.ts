import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import { teamMockData } from "./team-mock-data"
import { getUsers } from "@/modules/users/services/user-services"
import type { User } from "@/modules/users/services/types/user-types"
import type {
  Team,
  TeamMember,
  TeamRole,
  CreateTeamValues,
  EditTeamValues,
} from "./types/team-types"

const TEAMS_COLLECTION = "teams"
const MEMBERS_COLLECTION = "members"
const USER_TEAMS_COLLECTION = "userTeams"
let teamsCache: Team[] | null = null
let teamsPromise: Promise<Team[]> | null = null
let userTeamMembershipsCache:
  | Array<{ uid: string; teamId: string; teamName: string; role: TeamRole }>
  | null = null

function normalizeDate(date: Date | string | unknown): string {
  if (date instanceof Date) return date.toISOString()
  if (typeof date === "string") return date
  return new Date().toISOString()
}

function normalizeTeam(raw: Partial<Team> & { id: string }): Team {
  const isActive = raw.isActive ?? raw.status !== "Inactive"
  return {
    id: raw.id,
    name: raw.name ?? "Untitled Team",
    description: raw.description ?? "",
    createdBy: raw.createdBy ?? "system",
    maxMembers: raw.maxMembers ?? 100,
    memberCount: raw.memberCount ?? 0,
    status: raw.status ?? (isActive ? "Active" : "Inactive"),
    isActive,
    createdAt: normalizeDate(raw.createdAt),
    updatedAt: normalizeDate(raw.updatedAt),
  }
}

function normalizeMember(raw: Partial<TeamMember> & { uid: string }): TeamMember {
  const isActive = raw.isActive ?? raw.status !== "Inactive"
  return {
    uid: raw.uid,
    displayName: raw.displayName ?? raw.email ?? "Unnamed User",
    email: raw.email ?? "",
    role: normalizeTeamRole(raw.role),
    joinedAt: normalizeDate(raw.joinedAt),
    status: raw.status ?? (isActive ? "Active" : "Inactive"),
    isActive,
  }
}

function normalizeTeamRole(role: unknown): TeamRole {
  if (role === "Leader" || role === "Vice Leader" || role === "Member") {
    return role
  }
  if (role === "Owner") return "Leader"
  if (role === "Admin") return "Vice Leader"
  return "Member"
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  if (teamsCache) return teamsCache
  if (teamsPromise) return teamsPromise

  teamsPromise = loadTeams()
  try {
    teamsCache = await teamsPromise
    return teamsCache
  } finally {
    teamsPromise = null
  }
}

async function loadTeams(): Promise<Team[]> {
  const db = getDb()
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION))

  if (snapshot.empty) return []

  return snapshot.docs.map((d) => normalizeTeam({ ...(d.data() as Partial<Team>), id: d.id }))
}

function clearTeamsCache() {
  teamsCache = null
  teamsPromise = null
  userTeamMembershipsCache = null
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const db = getDb()
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION))
  const found = snapshot.docs.find((d) => d.id === teamId)
  if (!found) return null
  return normalizeTeam({ ...(found.data() as Partial<Team>), id: found.id })
}

export async function getTeamsByUser(uid: string): Promise<Team[]> {
  const db = getDb()
  const q = query(collection(db, USER_TEAMS_COLLECTION), where("uid", "==", uid), where("isActive", "==", true))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return []

  const teamIds = snapshot.docs.map((d) => d.data().teamId as string)
  const teams: Team[] = []

  for (const teamId of teamIds) {
    const team = await getTeamById(teamId)
    if (team) teams.push(team)
  }

  return teams
}

export async function createTeam(
  values: CreateTeamValues,
  user: { uid: string; displayName: string; email: string }
): Promise<Team> {
  const db = getDb()
  const teamId = `team-${Date.now()}`
  const now = new Date().toISOString()

  const team: Team = {
    id: teamId,
    name: values.name,
    description: values.description,
    createdBy: user.uid,
    maxMembers: values.maxMembers ?? 100,
    memberCount: 1,
    status: "Active",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }

  const member: TeamMember = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    role: "Leader",
    joinedAt: now,
    status: "Active",
    isActive: true,
  }

  const userTeam = {
    uid: user.uid,
    teamId,
    teamName: values.name,
    role: "Leader" as TeamRole,
    joinedAt: now,
    isActive: true,
  }

  const batch = writeBatch(db)
  batch.set(doc(db, TEAMS_COLLECTION, teamId), team)
  batch.set(doc(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION, user.uid), member)
  batch.set(doc(db, USER_TEAMS_COLLECTION, `${user.uid}_${teamId}`), userTeam)

  await batch.commit()
  clearTeamsCache()
  return team
}

export async function updateTeam(teamId: string, values: EditTeamValues): Promise<void> {
  const db = getDb()
  const ref = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(ref, {
    ...values,
    status: values.status ?? (values.isActive ? "Active" : "Inactive"),
    updatedAt: new Date().toISOString(),
  })
  clearTeamsCache()
}

export async function deactivateTeam(teamId: string): Promise<void> {
  const db = getDb()
  const ref = doc(db, TEAMS_COLLECTION, teamId)
  await updateDoc(ref, { isActive: false, status: "Inactive", updatedAt: new Date().toISOString() })
  clearTeamsCache()
}

export async function deleteTeam(teamId: string): Promise<void> {
  const db = getDb()
  // Delete all members first
  const membersSnapshot = await getDocs(collection(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION))
  const userTeamsSnapshot = await getDocs(
    query(collection(db, USER_TEAMS_COLLECTION), where("teamId", "==", teamId))
  )

  const batch = writeBatch(db)
  membersSnapshot.docs.forEach((d) => batch.delete(d.ref))
  userTeamsSnapshot.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, TEAMS_COLLECTION, teamId))

  await batch.commit()
  clearTeamsCache()
}

// ─── Members ────────────────────────────────────────────────────────────────

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const db = getDb()
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION))

  if (snapshot.empty) return []

  const users = await getUsers().catch(() => [])
  const workerIds = new Set(
    users.filter((user) => user.systemRole === "User").map((user) => user.uid)
  )

  return snapshot.docs
    .map((d) => {
      return normalizeMember({ ...(d.data() as Partial<TeamMember>), uid: d.id })
    })
    .filter((m) => m.isActive && m.status !== "Inactive" && workerIds.has(m.uid))
}

export async function getMemberCount(teamId: string): Promise<number> {
  return (await getTeamMembers(teamId)).length
}

export async function addMemberToTeam(
  teamId: string,
  member: { uid: string; displayName: string; email: string; role: TeamRole }
): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()
  const team = await getTeamById(teamId)
  if (!team) throw new Error("Team not found.")
  const memberships = await getUserTeamMemberships().catch(() => [])
  const existingMembership = memberships.find(
    (membership) => membership.uid === member.uid && membership.teamId !== teamId
  )
  if (existingMembership) {
    throw new Error(`${member.displayName} already belongs to ${existingMembership.teamName}.`)
  }
  const currentMembers = await getTeamMembers(teamId)
  if (
    member.role === "Leader" &&
    currentMembers.some((teamMember) => teamMember.role === "Leader" && teamMember.uid !== member.uid)
  ) {
    throw new Error("This team already has a Leader.")
  }
  if (
    member.role === "Vice Leader" &&
    currentMembers.some((teamMember) => teamMember.role === "Vice Leader" && teamMember.uid !== member.uid)
  ) {
    throw new Error("This team already has a Vice Leader.")
  }
  const memberCount = await getMemberCount(teamId)
  if (memberCount >= (team.maxMembers ?? 100)) {
    throw new Error("Team has reached the maximum number of members.")
  }

  const memberData: TeamMember = {
    uid: member.uid,
    displayName: member.displayName,
    email: member.email,
    role: member.role,
    joinedAt: now,
    status: "Active",
    isActive: true,
  }

  const userTeamData = {
    uid: member.uid,
    teamId,
    teamName: "",
    role: member.role,
    joinedAt: now,
    status: "Active",
    isActive: true,
  }

  const batch = writeBatch(db)
  batch.set(doc(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION, member.uid), memberData, { merge: true })
  batch.set(doc(db, USER_TEAMS_COLLECTION, `${member.uid}_${teamId}`), { ...userTeamData, teamName: team?.name ?? "" }, { merge: true })
  batch.update(doc(db, TEAMS_COLLECTION, teamId), {
    memberCount: memberCount + 1,
    updatedAt: now,
  })

  await batch.commit()
  clearTeamsCache()
}

export async function updateMemberRole(
  teamId: string,
  memberUid: string,
  role: TeamRole
): Promise<void> {
  const db = getDb()
  const members = await getTeamMembers(teamId)
  if (
    role === "Leader" &&
    members.some((member) => member.role === "Leader" && member.uid !== memberUid)
  ) {
    throw new Error("This team already has a Leader.")
  }
  if (
    role === "Vice Leader" &&
    members.some((member) => member.role === "Vice Leader" && member.uid !== memberUid)
  ) {
    throw new Error("This team already has a Vice Leader.")
  }
  const ref = doc(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION, memberUid)
  await updateDoc(ref, { role })

  // Update userTeams as well
  const userTeamsSnapshot = await getDocs(
    query(
      collection(db, USER_TEAMS_COLLECTION),
      where("uid", "==", memberUid),
      where("teamId", "==", teamId)
    )
  )
  const batch = writeBatch(db)
  userTeamsSnapshot.docs.forEach((d) => batch.update(d.ref, { role }))
  await batch.commit()
  clearTeamsCache()
}

export async function removeMemberFromTeam(teamId: string, memberUid: string): Promise<void> {
  const db = getDb()
  const memberRef = doc(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION, memberUid)
  const member = (await getTeamMembers(teamId)).find((item) => item.uid === memberUid)
  if (member?.role === "Leader" && (await isLastLeader(teamId))) {
    throw new Error("Cannot remove the last leader of a team.")
  }
  const memberCount = await getMemberCount(teamId)

  // Soft delete - mark isActive false
  const userTeamsSnapshot = await getDocs(
    query(
      collection(db, USER_TEAMS_COLLECTION),
      where("uid", "==", memberUid),
      where("teamId", "==", teamId)
    )
  )
  const batch = writeBatch(db)
  batch.update(memberRef, { isActive: false, status: "Inactive" })
  userTeamsSnapshot.docs.forEach((d) => batch.update(d.ref, { isActive: false }))
  batch.update(doc(db, TEAMS_COLLECTION, teamId), {
    memberCount: Math.max(0, memberCount - 1),
    updatedAt: new Date().toISOString(),
  })
  await batch.commit()
  clearTeamsCache()
}

export async function getUserRoleInTeam(teamId: string, uid: string): Promise<TeamRole | null> {
  const db = getDb()
  const ref = doc(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION, uid)
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION, teamId, MEMBERS_COLLECTION))
  const found = snapshot.docs.find((d) => d.id === uid)
  if (!found) return null
  const data = normalizeMember({ ...(found.data() as Partial<TeamMember>), uid })
  return data.isActive !== false && data.status !== "Inactive" ? data.role : null
}

export async function isLastLeader(teamId: string): Promise<boolean> {
  const members = await getTeamMembers(teamId)
  const leaders = members.filter((m) => m.role === "Leader" && m.isActive)
  return leaders.length === 1
}

export const isLastOwner = isLastLeader

// ─── Seed ────────────────────────────────────────────────────────────────────

export async function seedTeamsWithClient(): Promise<Team[]> {
  const db = getDb()
  const batch = writeBatch(db)
  const users = await getUsers()
  const now = new Date().toISOString()

  for (const [index, seedTeam] of teamMockData.entries()) {
    const members = pickSeedMembers(users, index)
    const team = normalizeTeam({
      ...seedTeam,
      memberCount: members.length,
      status: "Active",
      isActive: true,
      updatedAt: now,
    })
    batch.set(doc(db, TEAMS_COLLECTION, team.id), team, { merge: true })
    for (const member of members) {
      batch.set(doc(db, TEAMS_COLLECTION, team.id, MEMBERS_COLLECTION, member.uid), member, { merge: true })
      batch.set(doc(db, USER_TEAMS_COLLECTION, `${member.uid}_${team.id}`), {
        uid: member.uid,
        teamId: team.id,
        teamName: team.name,
        role: member.role,
        joinedAt: member.joinedAt,
        isActive: true,
        status: "Active",
      })
    }
  }

  await batch.commit()
  clearTeamsCache()
  return getTeams()
}

function pickSeedMembers(users: User[], teamIndex: number): TeamMember[] {
  const assignableUsers = users.filter((user) => user.systemRole === "User")
  if (assignableUsers.length === 0) return []

  const teamSize = Math.max(1, Math.ceil(assignableUsers.length / teamMockData.length))
  const offset = teamIndex * teamSize
  const source = assignableUsers.slice(offset, offset + teamSize)

  return source.map((user, index) => ({
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    role: index === 0 ? "Leader" : index === 1 ? "Vice Leader" : "Member",
    joinedAt: "2025-01-01T00:00:00.000Z",
    status: "Active",
    isActive: true,
  }))
}

export async function getAvailableUsersForTeam(teamId: string): Promise<User[]> {
  const [users, members] = await Promise.all([getUsers(), getTeamMembers(teamId)])
  const memberIds = new Set(members.map((member) => member.uid))
  const memberships = await getUserTeamMemberships().catch(() => [])
  const assignedUserIds = new Set(
    memberships
      .filter((membership) => membership.teamId !== teamId)
      .map((membership) => membership.uid)
  )
  return users.filter(
    (user) =>
      user.systemRole === "User" &&
      user.status !== "Inactive" &&
      !memberIds.has(user.uid) &&
      !assignedUserIds.has(user.uid)
  )
}

export async function getUserTeamMemberships(): Promise<Array<{ uid: string; teamId: string; teamName: string; role: TeamRole }>> {
  if (userTeamMembershipsCache) return userTeamMembershipsCache

  const db = getDb()
  const snapshot = await getDocs(query(collection(db, USER_TEAMS_COLLECTION), where("isActive", "==", true)))
  userTeamMembershipsCache = snapshot.docs.map((document) => {
    const data = document.data()
    return {
      uid: String(data.uid),
      teamId: String(data.teamId),
      teamName: String(data.teamName ?? ""),
      role: normalizeTeamRole(data.role),
    }
  })
  return userTeamMembershipsCache
}
