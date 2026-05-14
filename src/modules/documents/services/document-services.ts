import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"

import { db, getDb, storage } from "@/lib/firebase/client"
import { documentMockData } from "./document-mock-data"
import type { Document } from "./types/document-types"

const DOCUMENTS_COLLECTION = "documents"

export async function getDocuments(): Promise<Document[]> {
  if (!db) return documentMockData.map(normalizeDocument)

  try {
    const snapshot = await getDocs(collection(db, DOCUMENTS_COLLECTION))
    if (snapshot.empty) return documentMockData.map(normalizeDocument)

    return snapshot.docs.map((document) =>
      normalizeDocument({ ...(document.data() as Partial<Document>), id: document.id })
    )
  } catch (error) {
    console.warn("Failed to load documents from Firestore. Falling back to local mock data.", error)
    return documentMockData.map(normalizeDocument)
  }
}

export async function seedDocumentsWithClient(): Promise<Document[]> {
  const batch = writeBatch(getDb())
  documentMockData.forEach((d) => {
    batch.set(doc(getDb(), DOCUMENTS_COLLECTION, d.id), normalizeDocument(d), { merge: true })
  })
  await batch.commit()
  return getDocuments()
}

export async function createDocument(document: Document): Promise<Document> {
  const normalized = normalizeDocument(document)
  await setDoc(doc(getDb(), DOCUMENTS_COLLECTION, normalized.id), normalized)
  return normalized
}

export async function updateDocument(document: Document): Promise<Document> {
  const normalized = normalizeDocument(document)
  await updateDoc(doc(getDb(), DOCUMENTS_COLLECTION, normalized.id), normalized)
  return normalized
}

export async function deleteDocument(documentId: string, storageUrl?: string): Promise<void> {
  if (storageUrl) {
    try {
      const storageInstance = storage
      if (storageInstance) {
        const storageRef = ref(storageInstance, storageUrl)
        await deleteObject(storageRef)
      }
    } catch {
      // Storage file may not exist, continue with Firestore delete
    }
  }
  await deleteDoc(doc(getDb(), DOCUMENTS_COLLECTION, documentId))
}

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageInstance = storage
  if (!storageInstance) throw new Error("Firebase Storage not configured")

  return new Promise((resolve, reject) => {
    const storageRef = ref(storageInstance, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(progress)
      },
      (error) => {
        reject(error)
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(url)
        } catch {
          reject(new Error("Failed to get download URL"))
        }
      }
    )
  })
}

export async function uploadDocumentFile(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const path = `documents/${userId}/${timestamp}-${safeName}`
  const url = await uploadFile(file, path)
  return { url, path }
}

export function normalizeDocument(doc: Partial<Document>): Document {
  const now = new Date().toISOString()
  return {
    id: doc.id ?? `DOC-${Date.now()}`,
    name: doc.name ?? "Untitled",
    url: doc.url ?? "",
    type: doc.type ?? "application/octet-stream",
    size: doc.size ?? 0,
    taskId: doc.taskId ?? "",
    taskTitle: doc.taskTitle ?? "",
    teamId: doc.teamId ?? "",
    teamName: doc.teamName ?? "",
    uploadedBy: doc.uploadedBy ?? "",
    uploadedByName: doc.uploadedByName ?? "",
    createdAt: doc.createdAt ?? now,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getDocumentStats(docs: Document[]) {
  const totalSize = docs.reduce((sum, d) => sum + d.size, 0)
  const byType: Record<string, number> = {}
  for (const doc of docs) {
    const ext = doc.name.split(".").pop()?.toUpperCase() ?? "FILE"
    byType[ext] = (byType[ext] ?? 0) + 1
  }

  return {
    total: docs.length,
    totalSize,
    byType,
  }
}
