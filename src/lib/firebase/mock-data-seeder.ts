"use client"

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "./client"

type SeederModule = {
  name: string
  collections: {
    name: string
    data: unknown[]
    docIdField?: string
    isDocument?: boolean
  }[]
}

const SEEDER_MODULES: SeederModule[] = [
  {
    name: "Dashboard",
    collections: [
      { name: "dashboardRows", data: [] as unknown[], docIdField: "id" },
      { name: "pastPerformances", data: [] as unknown[], docIdField: "id" },
      { name: "keyPersonnel", data: [] as unknown[], docIdField: "id" },
      { name: "focusDocuments", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Dashboard-2",
    collections: [
      { name: "dashboard2Data", data: [] as unknown[], isDocument: true },
    ],
  },
  {
    name: "Dashboard-3 (Marketing)",
    collections: [
      { name: "marketingMetrics", data: [] as unknown[], docIdField: "title" },
      { name: "audiencePoints", data: [] as unknown[], docIdField: "date" },
      { name: "channelPerformances", data: [] as unknown[], docIdField: "channel" },
      { name: "socialMixes", data: [] as unknown[], docIdField: "name" },
      { name: "campaigns", data: [] as unknown[], docIdField: "name" },
      { name: "contentPipelines", data: [] as unknown[], docIdField: "stage" },
      { name: "topPosts", data: [] as unknown[], docIdField: "title" },
      { name: "activityFeeds", data: [] as unknown[], docIdField: "title" },
    ],
  },
  {
    name: "Tasks",
    collections: [
      { name: "tasks", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Users",
    collections: [
      { name: "users", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Chat",
    collections: [
      { name: "conversations", data: [] as unknown[], docIdField: "id" },
      { name: "messages", data: [] as unknown[], docIdField: "id" },
      { name: "chatUsers", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Mail",
    collections: [
      { name: "mails", data: [] as unknown[], docIdField: "id" },
      { name: "contacts", data: [] as unknown[], docIdField: "email" },
    ],
  },
  {
    name: "Calendar",
    collections: [
      { name: "events", data: [] as unknown[], docIdField: "id" },
      { name: "eventDates", data: [] as unknown[], docIdField: "id" },
      { name: "calendars", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "FAQs",
    collections: [
      { name: "faqs", data: [] as unknown[], docIdField: "id" },
      { name: "faqCategories", data: [] as unknown[], docIdField: "id" },
      { name: "faqFeatures", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Pricing",
    collections: [
      { name: "pricingFeatures", data: [] as unknown[], docIdField: "id" },
      { name: "pricingFaqs", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Settings",
    collections: [
      { name: "currentPlans", data: [] as unknown[], isDocument: true },
      { name: "billingHistories", data: [] as unknown[], docIdField: "id" },
    ],
  },
  {
    name: "Notifications",
    collections: [
      { name: "notifications", data: [] as unknown[], docIdField: "id" },
    ],
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WithId = Record<string, any> & { id?: string | number }

async function seedCollection(
  db: ReturnType<typeof getDb>,
  collectionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[] | Record<string, unknown>,
  docIdField?: string,
  isDocument = false
): Promise<number> {
  if (isDocument) {
    if (Array.isArray(data)) return 0
    const obj = data as Record<string, unknown>
    const batch = writeBatch(db)
    batch.set(
      doc(db, collectionName, "current"),
      { ...obj, seededAt: serverTimestamp() },
      { merge: true }
    )
    await batch.commit()
    return 1
  }

  const arr = data as unknown[]
  if (!arr.length) return 0

  const batch = writeBatch(db)
  let count = 0

  for (const item of arr) {
    const itemWithId = item as WithId
    const id =
      itemWithId[docIdField ?? "id"] ??
      itemWithId.id ??
      `seed-${count}`
    const ref = doc(db, collectionName, String(id))
    const itemObj = item as Record<string, unknown>
    batch.set(
      ref,
      { ...itemObj, seededAt: serverTimestamp() },
      { merge: true }
    )
    count++
  }

  await batch.commit()
  return count
}

export async function seedAllModules(
  onProgress?: (module: string, count: number) => void
): Promise<Record<string, number>> {
  const results: Record<string, number> = {}

  // Import all mock data dynamically to avoid circular deps
  const [
    { dashboardMockData },
    { dashboard2MockData },
    { metrics, audienceData, channelData, socialMixData, campaigns, contentPipeline, topPosts, activityFeed },
    { taskMockData },
    { userMockData },
    { chatMockData },
    { mails, contacts },
    { events, eventDates, calendars },
    { faqsMockData },
    { pricingMockData },
    { settingsMockData },
    { notificationMockData: notificationsMockData },
  ] = await Promise.all([
    import("@/modules/dashboard/services/dashboard-mock-data"),
    import("@/modules/dashboard-2/services/dashboard-2-mock-data"),
    import("@/modules/dashboard-3/services/dashboard-3-mock-data"),
    import("@/modules/tasks/services/task-mock-data"),
    import("@/modules/users/services/user-mock-data"),
    import("@/modules/chat/services/chat-mock-data"),
    import("@/modules/mail/services/mail-mock-data"),
    import("@/modules/calendar/services/calendar-mock-data"),
    import("@/modules/faqs/services/faqs-mock-data"),
    import("@/modules/pricing/services/pricing-mock-data"),
    import("@/modules/settings/services/settings-mock-data"),
    import("@/modules/notifications/services/notification-mock-data"),
  ])

  const db = getDb()

  // Dashboard
  {
    const collections = [
      { name: "dashboardRows", data: dashboardMockData.data, docIdField: "id" },
      { name: "pastPerformances", data: dashboardMockData.pastPerformanceData, docIdField: "id" },
      { name: "keyPersonnel", data: dashboardMockData.keyPersonnelData, docIdField: "id" },
      { name: "focusDocuments", data: dashboardMockData.focusDocumentsData, docIdField: "id" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`Dashboard / ${col.name}`] = count
      onProgress?.("Dashboard", count)
    }
  }

  // Dashboard-2
  {
    const count = await seedCollection(db, "dashboard2Data", dashboard2MockData.dashboardData as unknown as Record<string, unknown>, undefined, true)
    results["Dashboard-2 / dashboard2Data"] = count
    onProgress?.("Dashboard-2", count)
  }

  // Dashboard-3
  {
    const collections = [
      { name: "marketingMetrics", data: metrics, docIdField: "title" },
      { name: "audiencePoints", data: audienceData, docIdField: "date" },
      { name: "channelPerformances", data: channelData, docIdField: "channel" },
      { name: "socialMixes", data: socialMixData, docIdField: "name" },
      { name: "campaigns", data: campaigns, docIdField: "name" },
      { name: "contentPipelines", data: contentPipeline, docIdField: "stage" },
      { name: "topPosts", data: topPosts, docIdField: "title" },
      { name: "activityFeeds", data: activityFeed, docIdField: "title" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`Dashboard-3 / ${col.name}`] = count
      onProgress?.("Dashboard-3", count)
    }
  }

  // Tasks
  {
    const count = await seedCollection(db, "tasks", taskMockData, "id")
    results["Tasks / tasks"] = count
    onProgress?.("Tasks", count)
  }

  // Users
  {
    const count = await seedCollection(db, "users", userMockData, "id")
    results["Users / users"] = count
    onProgress?.("Users", count)
  }

  // Chat
  {
    const collections = [
      { name: "conversations", data: chatMockData.conversations, docIdField: "id" },
      { name: "chatUsers", data: chatMockData.users, docIdField: "id" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`Chat / ${col.name}`] = count
      onProgress?.("Chat", count)
    }
    // Flatten messages by conversation
    let totalMessages = 0
    for (const [convId, messages] of Object.entries(chatMockData.messages as Record<string, WithId[]>) as [string, WithId[]][]) {
      const count = await seedCollection(db, "messages", messages.map((m) => ({ ...m, conversationId: convId })), "id")
      totalMessages += count
    }
    results["Chat / messages"] = totalMessages
    onProgress?.("Chat", totalMessages)
  }

  // Mail
  {
    const collections = [
      { name: "mails", data: mails, docIdField: "id" },
      { name: "contacts", data: contacts, docIdField: "email" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`Mail / ${col.name}`] = count
      onProgress?.("Mail", count)
    }
  }

  // Calendar
  {
    const collections = [
      { name: "events", data: events, docIdField: "id" },
      { name: "eventDates", data: eventDates, docIdField: "id" },
      { name: "calendars", data: calendars, docIdField: "id" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`Calendar / ${col.name}`] = count
      onProgress?.("Calendar", count)
    }
  }

  // FAQs
  {
    const collections = [
      { name: "faqs", data: faqsMockData.faqs, docIdField: "id" },
      { name: "faqCategories", data: faqsMockData.categories, docIdField: "id" },
      { name: "faqFeatures", data: faqsMockData.features, docIdField: "id" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`FAQs / ${col.name}`] = count
      onProgress?.("FAQs", count)
    }
  }

  // Pricing
  {
    const collections = [
      { name: "pricingFeatures", data: pricingMockData.features, docIdField: "id" },
      { name: "pricingFaqs", data: pricingMockData.faqs, docIdField: "id" },
    ]
    for (const col of collections) {
      const count = await seedCollection(db, col.name, col.data, col.docIdField)
      results[`Pricing / ${col.name}`] = count
      onProgress?.("Pricing", count)
    }
  }

  // Settings
  {
    const count = await seedCollection(db, "currentPlans", settingsMockData.currentPlan as unknown as Record<string, unknown>, undefined, true)
    results["Settings / currentPlans"] = count
    onProgress?.("Settings", count)

    const histCount = await seedCollection(db, "billingHistories", settingsMockData.billingHistory, "id")
    results["Settings / billingHistories"] = histCount
    onProgress?.("Settings", histCount)
  }

  // Notifications
  {
    const count = await seedCollection(db, "notifications", notificationsMockData, "id")
    results["Notifications / notifications"] = count
    onProgress?.("Notifications", count)
  }

  return results
}

export async function seedModule(moduleName: string): Promise<Record<string, number>> {
  const results: Record<string, number> = {}

  const [
    { dashboardMockData },
    { dashboard2MockData },
    { metrics, audienceData, channelData, socialMixData, campaigns, contentPipeline, topPosts, activityFeed },
    { taskMockData },
    { userMockData },
    { chatMockData },
    { mails, contacts },
    { events, eventDates, calendars },
    { faqsMockData },
    { pricingMockData },
    { settingsMockData },
    { notificationMockData: notificationsMockData },
  ] = await Promise.all([
    import("@/modules/dashboard/services/dashboard-mock-data"),
    import("@/modules/dashboard-2/services/dashboard-2-mock-data"),
    import("@/modules/dashboard-3/services/dashboard-3-mock-data"),
    import("@/modules/tasks/services/task-mock-data"),
    import("@/modules/users/services/user-mock-data"),
    import("@/modules/chat/services/chat-mock-data"),
    import("@/modules/mail/services/mail-mock-data"),
    import("@/modules/calendar/services/calendar-mock-data"),
    import("@/modules/faqs/services/faqs-mock-data"),
    import("@/modules/pricing/services/pricing-mock-data"),
    import("@/modules/settings/services/settings-mock-data"),
    import("@/modules/notifications/services/notification-mock-data"),
  ])

  const db = getDb()

  switch (moduleName) {
    case "dashboard": {
      const cols = [
        { name: "dashboardRows", data: dashboardMockData.data, docIdField: "id" },
        { name: "pastPerformances", data: dashboardMockData.pastPerformanceData, docIdField: "id" },
        { name: "keyPersonnel", data: dashboardMockData.keyPersonnelData, docIdField: "id" },
        { name: "focusDocuments", data: dashboardMockData.focusDocumentsData, docIdField: "id" },
      ]
      for (const col of cols) {
        results[col.name] = await seedCollection(db, col.name, col.data, col.docIdField)
      }
      break
    }
    case "dashboard-2": {
      results["dashboard2Data"] = await seedCollection(db, "dashboard2Data", dashboard2MockData.dashboardData, undefined, true)
      break
    }
    case "dashboard-3": {
      const cols = [
        { name: "marketingMetrics", data: metrics, docIdField: "title" },
        { name: "audiencePoints", data: audienceData, docIdField: "date" },
        { name: "channelPerformances", data: channelData, docIdField: "channel" },
        { name: "socialMixes", data: socialMixData, docIdField: "name" },
        { name: "campaigns", data: campaigns, docIdField: "name" },
        { name: "contentPipelines", data: contentPipeline, docIdField: "stage" },
        { name: "topPosts", data: topPosts, docIdField: "title" },
        { name: "activityFeeds", data: activityFeed, docIdField: "title" },
      ]
      for (const col of cols) {
        results[col.name] = await seedCollection(db, col.name, col.data, col.docIdField)
      }
      break
    }
    case "tasks": {
      results["tasks"] = await seedCollection(db, "tasks", taskMockData, "id")
      break
    }
    case "users": {
      results["users"] = await seedCollection(db, "users", userMockData, "id")
      break
    }
    case "chat": {
      results["conversations"] = await seedCollection(db, "conversations", chatMockData.conversations, "id")
      results["chatUsers"] = await seedCollection(db, "chatUsers", chatMockData.users, "id")
      let total = 0
      for (const [convId, messages] of Object.entries(chatMockData.messages as Record<string, WithId[]>) as [string, WithId[]][]) {
        total += await seedCollection(db, "messages", messages.map((m) => ({ ...m, conversationId: convId })), "id")
      }
      results["messages"] = total
      break
    }
    case "mail": {
      results["mails"] = await seedCollection(db, "mails", mails, "id")
      results["contacts"] = await seedCollection(db, "contacts", contacts, "email")
      break
    }
    case "calendar": {
      results["events"] = await seedCollection(db, "events", events, "id")
      results["eventDates"] = await seedCollection(db, "eventDates", eventDates, "id")
      results["calendars"] = await seedCollection(db, "calendars", calendars, "id")
      break
    }
    case "faqs": {
      results["faqs"] = await seedCollection(db, "faqs", faqsMockData.faqs, "id")
      results["faqCategories"] = await seedCollection(db, "faqCategories", faqsMockData.categories, "id")
      results["faqFeatures"] = await seedCollection(db, "faqFeatures", faqsMockData.features, "id")
      break
    }
    case "pricing": {
      results["pricingFeatures"] = await seedCollection(db, "pricingFeatures", pricingMockData.features, "id")
      results["pricingFaqs"] = await seedCollection(db, "pricingFaqs", pricingMockData.faqs, "id")
      break
    }
    case "settings": {
      results["currentPlans"] = await seedCollection(db, "currentPlans", settingsMockData.currentPlan as unknown as Record<string, unknown>, undefined, true)
      results["billingHistories"] = await seedCollection(db, "billingHistories", settingsMockData.billingHistory, "id")
      break
    }
    case "notifications": {
      results["notifications"] = await seedCollection(db, "notifications", notificationsMockData, "id")
      break
    }
  }

  return results
}

export async function clearCollection(collectionName: string): Promise<void> {
  const db = getDb()
  const snapshot = await getDocs(collection(db, collectionName))
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export async function checkFirestoreStatus(): Promise<{
  configured: boolean
  projectId: string | null
}> {
  try {
    const { db, app } = await import("@/lib/firebase/client")
    if (!db || !app) {
      return { configured: false, projectId: null }
    }
    return {
      configured: true,
      projectId: app.options.projectId ?? null,
    }
  } catch {
    return { configured: false, projectId: null }
  }
}

export { SEEDER_MODULES }
export type { SeederModule }
