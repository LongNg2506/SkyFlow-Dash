"use client"

import * as React from "react"
import { CloudUpload, File, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "@/modules/documents/services/types/document-types"
import { uploadDocumentFile } from "@/modules/documents/services/document-services"
import type { Document } from "@/modules/documents/services/types/document-types"
import { getTasks } from "@/modules/tasks/services/task-services"
import type { Task } from "@/modules/tasks/services/types/task-types"
import { getTeams } from "@/modules/teams/services/team-services"
import type { Team } from "@/modules/teams/services/types/team-types"

interface UploadDocumentProps {
  currentUserId: string
  currentUserName: string
  onUploadSuccess?: (document: Document) => void
}

export function UploadDocument({
  currentUserId,
  currentUserName,
  onUploadSuccess,
}: UploadDocumentProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [dragOver, setDragOver] = React.useState(false)
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [teams, setTeams] = React.useState<Team[]>([])
  const [selectedTaskId, setSelectedTaskId] = React.useState("")
  const [selectedTeamId, setSelectedTeamId] = React.useState("")
  const [selectedTaskTitle, setSelectedTaskTitle] = React.useState("")

  React.useEffect(() => {
    Promise.all([getTasks(), getTeams()]).then(([t, tm]) => {
      setTasks(t)
      setTeams(tm)
    })
  }, [])

  function handleFileSelect(selected: File | null) {
    if (!selected) return

    if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
      toast.error("File type not allowed. Please upload PDF, DOC, DOCX, TXT, or image files.")
      return
    }

    if (selected.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
      return
    }

    setFile(selected)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    handleFileSelect(dropped ?? null)
  }

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      const { url } = await uploadDocumentFile(file, currentUserId)

      const task = tasks.find((t) => t.id === selectedTaskId)
      const team = teams.find((t) => t.id === selectedTeamId)

      const document: Document = {
        id: `DOC-${Date.now()}`,
        name: file.name,
        url,
        type: file.type,
        size: file.size,
        taskId: selectedTaskId,
        taskTitle: selectedTaskTitle || (task?.title ?? ""),
        teamId: selectedTeamId,
        teamName: team?.name ?? "",
        uploadedBy: currentUserId,
        uploadedByName: currentUserName,
        createdAt: new Date().toISOString(),
      }

      onUploadSuccess?.(document)
      toast.success(`"${file.name}" uploaded successfully.`)
      setFile(null)
      setSelectedTaskId("")
      setSelectedTaskTitle("")
      setSelectedTeamId("")
      setProgress(0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const taskOptions = tasks.slice(0, 20) // limit for performance

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          dragOver && "border-primary bg-primary/5",
          !dragOver && "hover:border-muted-foreground/50"
        )}
      >
        <input
          type="file"
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <CloudUpload className={cn("h-10 w-10 mb-2", dragOver ? "text-primary" : "text-muted-foreground")} />
        <p className="text-sm font-medium">
          {dragOver ? "Drop file here" : "Click or drag file to upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          PDF, DOC, DOCX, TXT, or images · Max {MAX_FILE_SIZE / 1024 / 1024}MB
        </p>
      </div>

      {/* Selected file */}
      {file && (
        <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/20">
          <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          {!uploading && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 cursor-pointer"
              onClick={() => setFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Task + Team selection */}
      {file && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Link to Task</label>
            <Select value={selectedTaskId} onValueChange={(v) => {
              setSelectedTaskId(v)
              const task = tasks.find((t) => t.id === v)
              setSelectedTaskTitle(task?.title ?? "")
            }}>
              <SelectTrigger className="h-8 text-sm cursor-pointer">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="cursor-pointer">None</SelectItem>
                {taskOptions.map((task) => (
                  <SelectItem key={task.id} value={task.id} className="cursor-pointer">
                    {task.title.length > 40 ? task.title.slice(0, 40) + "..." : task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Team</label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="h-8 text-sm cursor-pointer">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="cursor-pointer">None</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} className="cursor-pointer">
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full cursor-pointer"
        >
          {uploading ? `Uploading... ${Math.round(progress)}%` : "Upload Document"}
        </Button>
      )}
    </div>
  )
}
