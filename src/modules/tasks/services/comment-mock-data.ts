import { commentSchema } from "./types/comment-types"

const commentsData = [
  {
    id: "CMT-1001",
    taskId: "TASK-1001",
    content: "I've started implementing OAuth 2.0. Should we support Google and GitHub first? @Admin User",
    authorId: "user-001",
    authorName: "John Developer",
    mentions: [],
    createdAt: "2026-03-15T09:30:00Z",
  },
  {
    id: "CMT-1002",
    taskId: "TASK-1001",
    content: "Yes, let's focus on those two providers for MVP. @John Developer please also add error handling for token refresh.",
    authorId: "admin-001",
    authorName: "Admin User",
    mentions: ["user-001"],
    createdAt: "2026-03-15T10:15:00Z",
  },
  {
    id: "CMT-1003",
    taskId: "TASK-1002",
    content: "The memory leak is caused by event listeners not being cleaned up in the useEffect hook. Fixing now.",
    authorId: "user-002",
    authorName: "Jane Engineer",
    mentions: [],
    createdAt: "2026-04-20T14:00:00Z",
  },
  {
    id: "CMT-1004",
    taskId: "TASK-1005",
    content: "Root cause found: redirect URL was hardcoded. @Jane Engineer can you also update the docs after this fix?",
    authorId: "user-003",
    authorName: "Mike Tech",
    mentions: ["user-002"],
    createdAt: "2026-04-25T11:00:00Z",
  },
  {
    id: "CMT-1005",
    taskId: "TASK-1010",
    content: "For WebSockets, should we use Socket.io or native WebSocket API? Leaning towards Socket.io for easier room management.",
    authorId: "user-001",
    authorName: "John Developer",
    mentions: [],
    createdAt: "2026-05-01T16:30:00Z",
  },
]

export const commentMockData = commentSchema.array().parse(commentsData)
