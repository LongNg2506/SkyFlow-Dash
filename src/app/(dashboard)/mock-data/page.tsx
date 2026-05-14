"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  Database,
  Loader2,
  AlertCircle,
  Trash2,
  Zap,
  Info,
  XCircle,
  ArrowRight,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  seedAllModules,
  seedModule,
  clearCollection,
  checkFirestoreStatus,
} from "@/lib/firebase/mock-data-seeder"

const MODULES = [
  { id: "dashboard", name: "Dashboard", description: "Government contracts, key personnel, focus documents", collections: 4 },
  { id: "dashboard-2", name: "Dashboard-2", description: "Business metrics, sales, revenue", collections: 1 },
  { id: "dashboard-3", name: "Dashboard-3 (Marketing)", description: "Marketing metrics, campaigns, social", collections: 8 },
  { id: "tasks", name: "Tasks", description: "Task management with 50 sample tasks", collections: 1 },
  { id: "users", name: "Users", description: "User management with 15 sample users", collections: 1 },
  { id: "chat", name: "Chat", description: "Conversations, messages, chat users", collections: 3 },
  { id: "mail", name: "Mail", description: "Emails and contacts", collections: 2 },
  { id: "calendar", name: "Calendar", description: "Events, calendars, event dates", collections: 3 },
  { id: "faqs", name: "FAQs", description: "FAQ categories, questions, features", collections: 3 },
  { id: "pricing", name: "Pricing", description: "Pricing plans, features, FAQs", collections: 2 },
  { id: "settings", name: "Settings", description: "Current plan and billing history", collections: 2 },
]

interface SeedResult {
  module: string
  collections: Record<string, number>
  success: boolean
  error?: string
}

interface ModuleProgress {
  module: string
  status: "idle" | "seeding" | "done" | "error"
  error?: string
  collections?: Record<string, number>
}

export default function MockDataPage() {
  const [firestoreStatus, setFirestoreStatus] = useState<{
    configured: boolean
    projectId: string | null
  } | null>(null)
  const [statusCheckLoading, setStatusCheckLoading] = useState(true)

  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({})
  const [seedingAll, setSeedingAll] = useState(false)
  const [allResults, setAllResults] = useState<SeedResult[]>([])
  const [clearingModule, setClearingModule] = useState<string | null>(null)

  useEffect(() => {
    checkFirestoreStatus().then((status) => {
      setFirestoreStatus(status)
      setStatusCheckLoading(false)
    })
  }, [])

  const handleSeedModule = useCallback(async (moduleId: string) => {
    setModuleProgress((prev) => ({
      ...prev,
      [moduleId]: { module: moduleId, status: "seeding" },
    }))

    try {
      const results = await seedModule(moduleId)
      setModuleProgress((prev) => ({
        ...prev,
        [moduleId]: { module: moduleId, status: "done", collections: results },
      }))
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error"
      setModuleProgress((prev) => ({
        ...prev,
        [moduleId]: { module: moduleId, status: "error", error },
      }))
    }
  }, [])

  const handleSeedAll = useCallback(async () => {
    setSeedingAll(true)
    setAllResults([])
    const results: SeedResult[] = []

    for (const mod of MODULES) {
      setModuleProgress((prev) => ({
        ...prev,
        [mod.id]: { module: mod.id, status: "seeding" },
      }))

      try {
        const result = await seedModule(mod.id)
        results.push({ module: mod.id, collections: result, success: true })
        setModuleProgress((prev) => ({
          ...prev,
          [mod.id]: { module: mod.id, status: "done", collections: result },
        }))
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error"
        results.push({ module: mod.id, collections: {}, success: false, error })
        setModuleProgress((prev) => ({
          ...prev,
          [mod.id]: { module: mod.id, status: "error", error },
        }))
      }
    }

    setAllResults(results)
    setSeedingAll(false)
  }, [])

  const handleClearModule = useCallback(async (moduleId: string, collectionNames: string[]) => {
    setClearingModule(moduleId)
    for (const col of collectionNames) {
      try {
        await clearCollection(col)
      } catch {
        // continue with next
      }
    }
    setClearingModule(null)
    setModuleProgress((prev) => {
      const next = { ...prev }
      delete next[moduleId]
      return next
    })
  }, [])

  const seededCount = Object.values(moduleProgress).filter((p) => p.status === "done").length
  const totalModules = MODULES.length
  const progressPct = totalModules > 0 ? Math.round((seededCount / totalModules) * 100) : 0

  const totalDocs = Object.values(moduleProgress)
    .filter((p) => p.status === "done" && p.collections)
    .flatMap((p) => Object.values(p.collections!))
    .reduce((a, b) => a + b, 0)

  const getModuleCollections = (moduleId: string): string[] => {
    switch (moduleId) {
      case "dashboard": return ["dashboardRows", "pastPerformances", "keyPersonnel", "focusDocuments"]
      case "dashboard-2": return ["dashboard2Data"]
      case "dashboard-3": return ["marketingMetrics", "audiencePoints", "channelPerformances", "socialMixes", "campaigns", "contentPipelines", "topPosts", "activityFeeds"]
      case "tasks": return ["tasks"]
      case "users": return ["users"]
      case "chat": return ["conversations", "messages", "chatUsers"]
      case "mail": return ["mails", "contacts"]
      case "calendar": return ["events", "eventDates", "calendars"]
      case "faqs": return ["faqs", "faqCategories", "faqFeatures"]
      case "pricing": return ["pricingFeatures", "pricingFaqs"]
      case "settings": return ["currentPlans", "billingHistories"]
      default: return []
    }
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Mock Data Seeder</h1>
        <p className="text-muted-foreground">
          Seed sample data into Firestore for each module. Idempotent — re-seeding overwrites existing documents.
        </p>
      </div>

      {/* Firestore Status */}
      {statusCheckLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-muted-foreground">Checking Firestore connection...</span>
          </CardContent>
        </Card>
      ) : !firestoreStatus?.configured ? (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="flex items-start gap-3 pt-6">
            <XCircle className="size-4 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">Firestore Not Configured</p>
              <p className="text-sm text-red-700 dark:text-red-400">
                Firebase environment variables are missing. Add them to <code>.env.local</code> and restart the dev server.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle2 className="size-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Firebase Connected</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Project: <strong>{firestoreStatus.projectId}</strong>. Ready to seed data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={handleSeedAll}
          disabled={!firestoreStatus?.configured || seedingAll}
          size="sm"
        >
          {seedingAll ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Seeding all modules...
            </>
          ) : (
            <>
              <Zap className="size-4 mr-2" />
              Seed All Modules
            </>
          )}
        </Button>

        {seededCount > 0 && (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs">
              <Progress value={progressPct} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {seededCount}/{totalModules}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalDocs.toLocaleString()} documents seeded
            </span>
          </>
        )}
      </div>

      {/* Seed Results Summary */}
      {allResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seed Results</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Collections</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allResults.map((result) => {
                  const mod = MODULES.find((m) => m.id === result.module)
                  const docCount = Object.values(result.collections).reduce((a, b) => a + b, 0)
                  return (
                    <TableRow key={result.module}>
                      <TableCell className="font-medium">{mod?.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {Object.keys(result.collections).join(", ")}
                      </TableCell>
                      <TableCell>{docCount}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="size-3.5" /> Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="size-3.5" /> {result.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Module List */}
      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            Click &quot;Seed&quot; to populate a module&apos;s Firestore collection. Click &quot;Clear&quot; to delete all seeded documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODULES.map((mod) => {
                const progress = moduleProgress[mod.id]
                const isBusy = seedingAll || progress?.status === "seeding"
                const isDone = progress?.status === "done"
                const isError = progress?.status === "error"
                const isClearing = clearingModule === mod.id

                let statusIcon: React.ReactNode = null
                let statusText = "Not seeded"
                let statusClass = "text-muted-foreground"

                if (isDone) {
                  const docs = Object.values(progress.collections ?? {}).reduce((a, b) => a + b, 0)
                  statusIcon = <CheckCircle2 className="size-3.5 text-green-500" />
                  statusText = `${docs} documents seeded`
                  statusClass = "text-green-600"
                } else if (isError) {
                  statusIcon = <XCircle className="size-3.5 text-red-500" />
                  statusText = progress.error ?? "Error"
                  statusClass = "text-red-500"
                } else if (isBusy) {
                  statusIcon = <Loader2 className="size-3.5 animate-spin text-blue-500" />
                  statusText = "Seeding..."
                  statusClass = "text-blue-500"
                }

                return (
                  <TableRow key={mod.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{mod.name}</p>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {mod.collections} collection{mod.collections > 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 text-sm ${statusClass}`}>
                        {statusIcon}
                        <span>{statusText}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isDone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearModule(mod.id, getModuleCollections(mod.id))}
                            disabled={isClearing || !firestoreStatus?.configured}
                            className="text-muted-foreground hover:text-red-500 h-8 px-2"
                          >
                            {isClearing ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSeedModule(mod.id)}
                          disabled={!firestoreStatus?.configured || isBusy}
                          className="h-8"
                        >
                          {isBusy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <>
                              <Database className="size-3.5 mr-1.5" />
                              Seed
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="size-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-300">How it works</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This seeder uses Firestore batch writes with <code>merge: true</code> — idempotent and safe to re-run.
              Each document also gets a <code>seededAt</code> timestamp field. The seeded data will be used automatically
              when Firestore is reachable; otherwise the app falls back to local mock data.
              Data is stored under the collection names used by each module&apos;s service layer.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
