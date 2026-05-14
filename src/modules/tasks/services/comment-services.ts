import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { getFirestoreCollection } from "@/lib/firebase/firestore-query"
import { commentMockData } from "./comment-mock-data"
import type { Comment } from "./types/comment-types"

const COMMENTS_COLLECTION = "comments"

export async function getCommentsForTask(taskId: string): Promise<Comment[]> {
  const all = await getFirestoreCollection<Comment>(
    COMMENTS_COLLECTION,
    commentMockData
  )
  return all
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export async function seedCommentsWithClient(): Promise<Comment[]> {
  const batch = writeBatch(getDb())
  commentMockData.forEach((comment) => {
    batch.set(doc(getDb(), COMMENTS_COLLECTION, comment.id), comment, { merge: true })
  })
  await batch.commit()
  return getFirestoreCollection<Comment>(COMMENTS_COLLECTION, [])
}

export async function createComment(
  comment: Omit<Comment, "id" | "createdAt">
): Promise<Comment> {
  const id = `CMT-${Date.now()}`
  const now = new Date().toISOString()
  const newComment: Comment = {
    ...comment,
    id,
    createdAt: now,
  }
  await setDoc(doc(getDb(), COMMENTS_COLLECTION, id), newComment)
  return newComment
}

export async function deleteComment(commentId: string): Promise<void> {
  await deleteDoc(doc(getDb(), COMMENTS_COLLECTION, commentId))
}

export async function getAllUsersForMention(): Promise<
  Array<{ uid: string; displayName: string }>
> {
  try {
    const snapshot = await getDocs(collection(getDb(), "users"))
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        uid: d.id,
        displayName: data.displayName || data.email || d.id,
      }
    })
  } catch {
    return []
  }
}

export function parseMentionsFromText(
  text: string,
  users: Array<{ uid: string; displayName: string }>
): string[] {
  const mentionPattern = /@(\S+)/g
  const mentionedIds: string[] = []
  let match

  while ((match = mentionPattern.exec(text)) !== null) {
    const name = match[1].toLowerCase()
    const user = users.find(
      (u) => u.displayName.toLowerCase().includes(name)
    )
    if (user && !mentionedIds.includes(user.uid)) {
      mentionedIds.push(user.uid)
    }
  }

  return mentionedIds
}
