import { z } from "zod"

export const teamRoleSchema = z.enum(["Leader", "Vice Leader", "Member"])
export type TeamRole = z.infer<typeof teamRoleSchema>

export const teamMemberSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  email: z.string(),
  role: teamRoleSchema,
  joinedAt: z.string().or(z.date()),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  isActive: z.boolean().default(true),
})

export type TeamMember = z.infer<typeof teamMemberSchema>

export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdBy: z.string(),
  maxMembers: z.number().default(100),
  memberCount: z.number().default(0),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type Team = z.infer<typeof teamSchema>

export const teamWithMemberCountSchema = teamSchema.extend({
  ownerName: z.string().optional(),
})

export type TeamWithMemberCount = z.infer<typeof teamWithMemberCountSchema>

export const createTeamSchema = z.object({
  name: z.string().min(2, "Tên team phải có ít nhất 2 ký tự").max(50, "Tên team không quá 50 ký tự"),
  description: z.string().max(200, "Mô tả không quá 200 ký tự"),
  maxMembers: z.number().min(2).max(500),
})

export type CreateTeamValues = z.infer<typeof createTeamSchema>

export const addMemberSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  email: z.string(),
  role: teamRoleSchema,
})

export type AddMemberValues = z.infer<typeof addMemberSchema>

export const editTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200),
  maxMembers: z.number().min(2).max(500),
  status: z.enum(["Active", "Inactive"]).optional(),
  isActive: z.boolean(),
})

export type EditTeamValues = z.infer<typeof editTeamSchema>
