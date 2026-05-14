import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { meetingMockData } from "./meeting-mock-data"
import type { Meeting } from "./types/meeting-types"

const MEETINGS_COLLECTION = "meetings"

export async function getMeetings(): Promise<Meeting[]> {
  try {
    const snapshot = await getDocs(collection(getDb(), MEETINGS_COLLECTION))
    if (snapshot.empty) return meetingMockData.map(normalizeMeeting)

    return snapshot.docs.map((document) =>
      normalizeMeeting({ ...(document.data() as Partial<Meeting>), id: document.id })
    )
  } catch (error) {
    console.warn("Failed to load meetings from Firestore. Falling back to local mock data.", error)
    return meetingMockData.map(normalizeMeeting)
  }
}

export async function seedMeetingsWithClient(): Promise<Meeting[]> {
  const batch = writeBatch(getDb())
  meetingMockData.forEach((meeting) => {
    batch.set(doc(getDb(), MEETINGS_COLLECTION, meeting.id), normalizeMeeting(meeting), { merge: true })
  })
  await batch.commit()
  return getMeetings()
}

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  const normalized = normalizeMeeting(meeting)
  await setDoc(doc(getDb(), MEETINGS_COLLECTION, normalized.id), normalized)
  return normalized
}

export async function updateMeeting(meeting: Meeting): Promise<Meeting> {
  const now = new Date().toISOString()
  const normalized = normalizeMeeting(meeting)
  const updated = { ...normalized, updatedAt: now }
  await updateDoc(doc(getDb(), MEETINGS_COLLECTION, updated.id), updated)
  return updated
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await deleteDoc(doc(getDb(), MEETINGS_COLLECTION, meetingId))
}

export function normalizeMeeting(meeting: Partial<Meeting>): Meeting {
  const now = new Date().toISOString()
  const teamIds = meeting.teamIds?.length
    ? meeting.teamIds
    : meeting.teamId
      ? [meeting.teamId]
      : []
  const teamNames = meeting.teamNames?.length
    ? meeting.teamNames
    : meeting.teamName
      ? [meeting.teamName]
      : []

  return {
    id: meeting.id ?? `MTG-${Date.now()}`,
    title: meeting.title ?? "Untitled Meeting",
    description: meeting.description ?? "",
    date: meeting.date ?? now,
    duration: meeting.duration ?? 30,
    teamId: meeting.teamId ?? teamIds[0] ?? "",
    teamName: meeting.teamName ?? teamNames[0] ?? "",
    teamIds,
    teamNames,
    organizerId: meeting.organizerId ?? "",
    organizerName: meeting.organizerName ?? "",
    attendees: meeting.attendees ?? [],
    notes: meeting.notes ?? "",
    decisions: meeting.decisions ?? [],
    actionItems: meeting.actionItems ?? [],
    createdAt: meeting.createdAt ?? now,
    updatedAt: meeting.updatedAt ?? now,
  }
}

export function getMeetingStats(meetings: Meeting[]) {
  const now = new Date()
  const upcoming = meetings.filter((m) => new Date(m.date) > now)
  const past = meetings.filter((m) => new Date(m.date) <= now)

  return {
    total: meetings.length,
    upcoming: upcoming.length,
    past: past.length,
    withActionItems: meetings.filter((m) => m.actionItems.length > 0).length,
  }
}
