import { meetingSchema } from "./types/meeting-types"

const meetingsData = [
  {
    id: "MTG-1001",
    title: "Sprint Planning Q2 Week 1",
    description: "Plan tasks and assign priorities for the upcoming sprint cycle.",
    date: "2026-05-10T09:00:00Z",
    duration: 60,
    teamId: "team-001",
    teamName: "Frontend Team",
    organizerId: "user-001",
    organizerName: "John Developer",
    attendees: [
      { uid: "user-001", displayName: "John Developer", email: "john@email.com", status: "accepted" },
      { uid: "user-002", displayName: "Jane Engineer", email: "jane@email.com", status: "accepted" },
      { uid: "user-003", displayName: "Mike Tech", email: "mike@email.com", status: "pending" },
    ],
    notes: "Focus on the new authentication module. Prioritize API integration tasks.",
    decisions: [
      "Authentication module is the top priority for this sprint",
      "Code review must be done within 24 hours of PR submission",
    ],
    actionItems: [
      { id: "AI-001", title: "Set up OAuth 2.0 endpoints", assigneeId: "user-001", assigneeName: "John Developer", dueDate: "2026-05-12", completed: false },
      { id: "AI-002", title: "Write unit tests for auth service", assigneeId: "user-002", assigneeName: "Jane Engineer", dueDate: "2026-05-13", completed: false },
    ],
    createdAt: "2026-05-08T10:00:00Z",
    updatedAt: "2026-05-08T10:00:00Z",
  },
  {
    id: "MTG-1002",
    title: "Product Roadmap Review",
    description: "Review Q3 roadmap and align team on feature priorities.",
    date: "2026-05-12T14:00:00Z",
    duration: 90,
    teamId: "team-002",
    teamName: "Product Team",
    organizerId: "admin-001",
    organizerName: "Admin User",
    attendees: [
      { uid: "admin-001", displayName: "Admin User", email: "admin@email.com", status: "accepted" },
      { uid: "user-001", displayName: "John Developer", status: "accepted" },
    ],
    notes: "Discuss new dashboard analytics feature. Timeline: 6 weeks.",
    decisions: [
      "Dashboard analytics will launch in Q3",
      "Mobile app redesign postponed to Q4",
    ],
    actionItems: [
      { id: "AI-003", title: "Create wireframes for dashboard", assigneeId: "user-001", assigneeName: "John Developer", dueDate: "2026-05-15", completed: false },
    ],
    createdAt: "2026-05-07T08:00:00Z",
    updatedAt: "2026-05-07T08:00:00Z",
  },
  {
    id: "MTG-1003",
    title: "Bug Triage Meeting",
    description: "Review and prioritize incoming bug reports from QA.",
    date: "2026-05-08T11:00:00Z",
    duration: 30,
    organizerId: "user-002",
    organizerName: "Jane Engineer",
    attendees: [
      { uid: "user-002", displayName: "Jane Engineer", status: "accepted" },
      { uid: "user-003", displayName: "Mike Tech", status: "declined" },
    ],
    notes: "3 critical bugs identified from the last release.",
    decisions: [
      "Memory leak bug is P0 — fix immediately",
      "Mobile upload bug is P1 — fix within this sprint",
    ],
    actionItems: [
      { id: "AI-004", title: "Fix memory leak in dashboard", assigneeId: "user-002", assigneeName: "Jane Engineer", dueDate: "2026-05-09", completed: true },
      { id: "AI-005", title: "Fix mobile image upload", assigneeId: "user-003", assigneeName: "Mike Tech", dueDate: "2026-05-11", completed: false },
    ],
    createdAt: "2026-05-07T15:00:00Z",
    updatedAt: "2026-05-07T15:00:00Z",
  },
  {
    id: "MTG-1004",
    title: "Design System Update",
    description: "Review new design tokens and update component library accordingly.",
    date: "2026-05-15T10:00:00Z",
    duration: 45,
    teamId: "team-001",
    teamName: "Frontend Team",
    organizerId: "user-001",
    organizerName: "John Developer",
    attendees: [
      { uid: "user-001", displayName: "John Developer", status: "accepted" },
    ],
    notes: "New color palette and typography changes.",
    decisions: [],
    actionItems: [],
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-10T09:00:00Z",
  },
]

export const meetingMockData = meetingSchema.array().parse(meetingsData)
