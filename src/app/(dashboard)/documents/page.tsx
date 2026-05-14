"use client"

import { useCallback, useEffect, useState } from "react"
import { Database, File, HardDrive, Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"
import {
  createDocument,
  getDocuments,
  getDocumentStats,
  seedDocumentsWithClient,
} from "@/modules/documents/services/document-services"
import { formatFileSize } from "@/modules/documents/services/document-services"
import type { Document } from "@/modules/documents/services/types/document-types"
import { DocumentList } from "@/modules/documents/components/document-list"
import { UploadDocument } from "@/modules/documents/components/upload-document"

export default function DocumentsPage() {
  const { profile } = useCurrentUserProfile()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    getDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [])

  const stats = getDocumentStats(documents)
  const canDelete = profile?.systemRole === "Admin" || profile?.systemRole === "Manager"

  const handleUploadSuccess = useCallback(async (doc: Document) => {
    const created = await createDocument(doc)
    setDocuments((prev: Document[]) => [created, ...prev])
    setUploadOpen(false)
  }, [])

  const handleRefresh = useCallback(() => {
    getDocuments()
      .then(setDocuments)
      .catch(() => {/* non-critical */})
  }, [])

  const handleSeed = useCallback(async () => {
    try {
      setIsSeeding(true)
      const seeded = await seedDocumentsWithClient()
      setDocuments(seeded)
      toast.success("Documents seeded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed.")
    } finally {
      setIsSeeding(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading documents...</div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Upload and manage project documents, attached to tasks or teams.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={isSeeding}
              className="cursor-pointer"
            >
              {isSeeding ? "Seeding..." : "Seed Data"}
            </Button>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                {profile ? (
                  <UploadDocument
                    currentUserId={profile.uid}
                    currentUserName={profile.displayName ?? profile.email ?? "Unknown"}
                    onUploadSuccess={handleUploadSuccess}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Please sign in to upload documents.</p>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="h-full flex-1 flex-col space-y-6 px-4 md:px-6 md:flex">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Files</p>
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <File className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Size</p>
                  <span className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</span>
                </div>
                <HardDrive className="size-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm font-medium mb-2">By Type</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document list */}
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>
              Search, filter, and manage your uploaded files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentList
              documents={documents}
              currentUserId={profile?.uid}
              currentUserName={profile?.displayName ?? ""}
              canDelete={canDelete}
              onDocumentsChange={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
