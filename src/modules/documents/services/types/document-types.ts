import { z } from "zod"

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  teamId: z.string().optional(),
  teamName: z.string().optional(),
  uploadedBy: z.string(),
  uploadedByName: z.string(),
  createdAt: z.string(),
})

export type Document = z.infer<typeof documentSchema>

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "text/plain": "TXT",
}
