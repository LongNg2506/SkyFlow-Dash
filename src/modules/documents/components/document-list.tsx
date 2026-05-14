"use client"

import * as React from "react"
import {
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileText,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FILE_TYPE_LABELS } from "@/modules/documents/services/types/document-types"
import {
  deleteDocument,
  formatFileSize,
} from "@/modules/documents/services/document-services"
import type { Document } from "@/modules/documents/services/types/document-types"
import { getTasks } from "@/modules/tasks/services/task-services"
import type { Task } from "@/modules/tasks/services/types/task-types"

interface DocumentListProps {
  documents: Document[]
  currentUserId?: string
  currentUserName?: string
  canDelete?: boolean
  onDocumentsChange?: () => void
}

export function DocumentList({
  documents,
  currentUserId,
  canDelete = false,
  onDocumentsChange,
}: DocumentListProps) {
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [deleteTarget, setDeleteTarget] = React.useState<Document | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const filtered = React.useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
      const matchesType =
        typeFilter === "all" || doc.name.endsWith(`.${typeFilter.toLowerCase()}`)
      return matchesSearch && matchesType
    })
  }, [documents, search, typeFilter])

  const fileTypes = React.useMemo(() => {
    const types = new Set<string>()
    for (const doc of documents) {
      const ext = doc.name.split(".").pop()?.toUpperCase() ?? ""
      if (ext) types.add(ext)
    }
    return Array.from(types).sort()
  }, [documents])

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteDocument(deleteTarget.id, deleteTarget.url)
      onDocumentsChange?.()
      setDeleteTarget(null)
    } catch (err) {
      console.error("Failed to delete document:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  function getFileIcon(doc: Document) {
    const ext = doc.name.split(".").pop()?.toLowerCase() ?? ""
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return <FileImage className="h-5 w-5 text-blue-500" />
    if (["pdf"].includes(ext))
      return <FileText className="h-5 w-5 text-red-500" />
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
      return <FileArchive className="h-5 w-5 text-yellow-500" />
    if (["js", "ts", "tsx", "jsx", "py", "java", "go", "rs"].includes(ext))
      return <FileCode className="h-5 w-5 text-green-500" />
    return <File className="h-5 w-5 text-muted-foreground" />
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border rounded-lg bg-muted/20">
        <div className="text-center">
          <File className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm cursor-text"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-8 text-sm cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
            {fileTypes.map((type) => (
              <SelectItem key={type} value={type.toLowerCase()} className="cursor-pointer">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No documents match your search.
          </p>
        ) : (
          filtered.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              getFileIcon={getFileIcon}
              canDelete={canDelete}
              onDelete={() => setDeleteTarget(doc)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.name}&quot;</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DocumentRowProps {
  document: Document
  getFileIcon: (doc: Document) => React.ReactNode
  canDelete: boolean
  onDelete: () => void
}

function DocumentRow({ document: doc, getFileIcon, canDelete, onDelete }: DocumentRowProps) {
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
    doc.name.split(".").pop()?.toLowerCase() ?? ""
  )

  return (
    <div className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/30 transition-colors group">
      <div className="flex-shrink-0">{getFileIcon(doc)}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(doc.size)}</span>
          <span>·</span>
          <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
          {doc.uploadedByName && (
            <>
              <span>·</span>
              <span>{doc.uploadedByName}</span>
            </>
          )}
        </div>
        {doc.taskTitle && (
          <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
            {doc.taskTitle}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isImage && doc.url && (
          <img
            src={doc.url}
            alt={doc.name}
            className="h-10 w-10 object-cover rounded border"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        )}
        {doc.url && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            asChild
          >
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {doc.url && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            asChild
          >
            <a href={doc.url} download={doc.name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
