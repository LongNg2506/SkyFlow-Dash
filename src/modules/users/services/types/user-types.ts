export type SystemRole = "Admin" | "Manager" | "User"
export type UserStatus = "Active" | "Pending" | "Inactive"

export interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string | null
  systemRole: SystemRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  teams?: string[]
  assignedTasks?: number

  /**
   * Legacy fields are kept optional so old seeded documents can still render
   * while the app migrates to uid/displayName/systemRole.
   */
  id?: number | string
  name?: string
  avatar?: string
  role?: string
  plan?: string
  billing?: string
  joinedDate?: string
  lastLogin?: string
}

export interface UserFormValues {
  displayName: string
  email: string
  systemRole: SystemRole
  status: UserStatus
}

export interface UserWithStats extends User {
  teamNames: string[]
  teamRoles: Array<{
    teamName: string
    role: string
  }>
  assignedTasks: number
}
