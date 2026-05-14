import { teamSchema, teamMemberSchema, type Team, type TeamMember } from "./types/team-types"

const teamsData = [
  {
    id: "TEAM-001",
    name: "BA Team",
    description: "Phân tích nghiệp vụ, thiết kế quy trình và yêu cầu dự án",
    createdBy: "placeholder-owner",
    maxMembers: 100,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "TEAM-002",
    name: "Design Team",
    description: "Thiết kế giao diện, UX/UI và tài nguyên đồ họa",
    createdBy: "placeholder-owner",
    maxMembers: 100,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "TEAM-003",
    name: "Frontend Team",
    description: "Phụ trách giao diện người dùng và trải nghiệm ứng dụng",
    createdBy: "placeholder-owner",
    maxMembers: 100,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "TEAM-004",
    name: "Backend Team",
    description: "Phụ trách API, Firebase, database và xử lý nghiệp vụ",
    createdBy: "placeholder-owner",
    maxMembers: 100,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "TEAM-005",
    name: "QA/Testing Team",
    description: "Kiểm thử chức năng, phát hiện lỗi và đảm bảo chất lượng",
    createdBy: "placeholder-owner",
    maxMembers: 100,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
]

export const teamMockData: Team[] = teamSchema.array().parse(teamsData)

export const teamMemberMockData: TeamMember[] = [
  {
    uid: "placeholder-owner",
    displayName: "Long Nguyen",
    email: "vietlong2506.korea@gmail.com",
    role: "Leader",
    joinedAt: "2025-01-01T00:00:00.000Z",
    status: "Active",
    isActive: true,
  },
]
