import fs from "node:fs"
import path from "node:path"

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "")
    process.env[key] = process.env[key] ?? value
  }
}

loadEnv()

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

if (!apiKey || !projectId) {
  throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID")
}

const temporaryPassword = "User@123456"
const now = new Date().toISOString()
const users = [
  ["skyflow.user01@example.com", "An Nguyen"],
  ["skyflow.user02@example.com", "Binh Tran"],
  ["skyflow.user03@example.com", "Chi Le"],
  ["skyflow.user04@example.com", "Duc Pham"],
  ["skyflow.user05@example.com", "Giang Vo"],
  ["skyflow.user06@example.com", "Hanh Dang"],
  ["skyflow.user07@example.com", "Khoa Hoang"],
  ["skyflow.user08@example.com", "Linh Do"],
  ["skyflow.user09@example.com", "Minh Bui"],
  ["skyflow.user10@example.com", "Nam Vu"],
  ["skyflow.user11@example.com", "Oanh Huynh"],
  ["skyflow.user12@example.com", "Phuc Ngo"],
  ["skyflow.user13@example.com", "Quang Dinh"],
  ["skyflow.user14@example.com", "Thao Mai"],
  ["skyflow.user15@example.com", "Vy Phan"],
]

async function requestJson(url, init) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(20000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error?.message ?? response.statusText)
    error.status = response.status
    error.payload = data
    throw error
  }
  return data
}

async function signUp(email, password, displayName) {
  return requestJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  )
}

async function signIn(email, password) {
  return requestJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
}

async function upsertUserProfile(idToken, uid, email, displayName) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/users/${uid}`

  return requestJson(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: uid },
        displayName: { stringValue: displayName },
        email: { stringValue: email },
        photoURL: { nullValue: null },
        systemRole: { stringValue: "User" },
        status: { stringValue: "Active" },
        createdAt: { stringValue: now },
        updatedAt: { stringValue: now },
        avatar: { stringValue: initials(displayName) },
      },
    }),
  })
}

function initials(displayName) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

for (const [email, displayName] of users) {
  let authData

  try {
    authData = await signUp(email, temporaryPassword, displayName)
    console.log(`created auth: ${email}`)
  } catch (error) {
    if (error.message !== "EMAIL_EXISTS") {
      throw error
    }
    authData = await signIn(email, temporaryPassword)
    console.log(`signed in existing auth: ${email}`)
  }

  await upsertUserProfile(authData.idToken, authData.localId, email, displayName)
  console.log(`upserted firestore user: ${email}`)
}

console.log(`Done. Temporary password for seeded users: ${temporaryPassword}`)
