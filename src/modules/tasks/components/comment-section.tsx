"use client"

import * as React from "react"
import { AtSign, MessageSquare, Send, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi, enUS } from "date-fns/locale"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Comment } from "@/modules/tasks/services/types/comment-types"
import type { Task } from "@/modules/tasks/services/types/task-types"
import {
  createComment,
  deleteComment,
  getAllUsersForMention,
  getCommentsForTask,
  parseMentionsFromText,
} from "@/modules/tasks/services/comment-services"
import {
  notifyCommentAdded,
  notifyMention,
} from "@/modules/notifications/services/notification-services"
import type { CurrentUserProfile } from "@/modules/users/hooks/use-current-user-profile"

interface CommentSectionProps {
  task: Task
  currentUser: CurrentUserProfile | null
  onCommentCountChange?: (count: number) => void
}

interface MentionUser {
  uid: string
  displayName: string
}

export function CommentSection({
  task,
  currentUser,
  onCommentCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = React.useState<Comment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newComment, setNewComment] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mentionUsers, setMentionUsers] = React.useState<MentionUser[]>([])
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [showMentionDropdown, setShowMentionDropdown] = React.useState(false)
  const [mentionFilter, setMentionFilter] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const mentionDropdownRef = React.useRef<HTMLDivElement>(null)

  // Load comments and users
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      getCommentsForTask(task.id),
      getAllUsersForMention(),
    ]).then(([loadedComments, users]) => {
      if (cancelled) return
      setComments(loadedComments)
      setMentionUsers(users)
      onCommentCountChange?.(loadedComments.length)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [task.id, onCommentCountChange])

  // Close mention dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentionDropdown(false)
        setMentionFilter("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredMentionUsers = React.useMemo(() => {
    if (!mentionFilter) return mentionUsers.slice(0, 5)
    const q = mentionFilter.toLowerCase()
    return mentionUsers
      .filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) &&
          u.uid !== currentUser?.uid
      )
      .slice(0, 5)
  }, [mentionUsers, mentionFilter, currentUser?.uid])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setNewComment(value)

    // Detect @mention
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf("@")

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1)
      if (!textAfterAt.includes(" ") && textAfterAt.length < 30) {
        setMentionFilter(textAfterAt)
        setShowMentionDropdown(true)
      } else {
        setShowMentionDropdown(false)
        setMentionFilter("")
      }
    } else {
      setShowMentionDropdown(false)
      setMentionFilter("")
    }
  }

  function insertMention(displayName: string) {
    const cursorPos = textareaRef.current?.selectionStart ?? newComment.length
    const textBeforeCursor = newComment.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf("@")
    const textAfterCursor = newComment.slice(cursorPos)

    const newText =
      newComment.slice(0, atIndex) +
      `@${displayName} ` +
      textAfterCursor

    setNewComment(newText)
    setShowMentionDropdown(false)
    setMentionFilter("")

    // Refocus textarea and set cursor after mention
    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = atIndex + displayName.length + 2
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !currentUser) return

    setIsSubmitting(true)
    try {
      const mentions = parseMentionsFromText(newComment, mentionUsers)
      const comment = await createComment({
        taskId: task.id,
        content: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName ?? currentUser.email ?? "Unknown",
        mentions,
      })

      setComments((prev) => [...prev, comment])
      onCommentCountChange?.(comments.length + 1)
      setNewComment("")
      setShowMentionDropdown(false)
      setMentionFilter("")

      // Send notifications
      // Notify task assignee if different from commenter
      if (task.assigneeId && task.assigneeId !== currentUser.uid) {
        notifyCommentAdded(
          task,
          currentUser.uid,
          currentUser.displayName ?? "Someone",
          task.assigneeId,
          newComment.trim()
        ).catch(() => {/* non-critical */})
      }

      // Notify mentions
      for (const mentionedId of mentions) {
        if (mentionedId !== currentUser.uid) {
          notifyMention(
            task,
            mentionedId,
            currentUser.uid,
            currentUser.displayName ?? "Someone"
          ).catch(() => {/* non-critical */})
        }
      }
    } catch (err) {
      console.error("Failed to create comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteComment(commentId)
      setComments((prev) => {
        const updated = prev.filter((c) => c.id !== commentId)
        onCommentCountChange?.(updated.length)
        return updated
      })
    } catch (err) {
      console.error("Failed to delete comment:", err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmitComment()
    }
    if (e.key === "Escape") {
      setShowMentionDropdown(false)
      setMentionFilter("")
    }
    if (showMentionDropdown && e.key === "ArrowDown") {
      e.preventDefault()
      const first = mentionDropdownRef.current?.querySelector("button")
      first?.focus()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Comments ({comments.length})
        </span>
      </div>

      {/* Comment input */}
      {currentUser ? (
        <div className="relative">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {(currentUser.displayName ?? currentUser.email ?? "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment... Use @name to mention someone (Ctrl+Enter to submit)"
                value={newComment}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={2}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground cursor-pointer"
                    onClick={() => {
                      const cursorPos = textareaRef.current?.selectionStart ?? newComment.length
                      const newText =
                        newComment.slice(0, cursorPos) +
                        "@" +
                        newComment.slice(cursorPos)
                      setNewComment(newText)
                      textareaRef.current?.focus()
                    }}
                  >
                    <AtSign className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    @ to mention
                  </span>
                </div>
                <Button
                  size="sm"
                  className="h-7 cursor-pointer"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>

          {/* Mention dropdown */}
          {showMentionDropdown && filteredMentionUsers.length > 0 && (
            <div
              ref={mentionDropdownRef}
              className="absolute left-8 top-20 z-50 w-64 rounded-md border bg-popover shadow-md"
            >
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                Mention someone
              </div>
              {filteredMentionUsers.map((user) => (
                <button
                  key={user.uid}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted cursor-pointer text-left"
                  onClick={() => insertMention(user.displayName)}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {user.displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to leave a comment.
        </p>
      )}

      <Separator />

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-12 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-3 pr-2">
            {comments.map((comment) => {
              const canDelete =
                currentUser?.uid === comment.authorId ||
                currentUser?.systemRole === "Admin" ||
                currentUser?.systemRole === "Manager"

              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canDelete={canDelete}
                  currentUserId={currentUser?.uid}
                  onDelete={handleDeleteComment}
                />
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  canDelete: boolean
  currentUserId?: string
  onDelete: (commentId: string) => void
}

function CommentItem({
  comment,
  canDelete,
  currentUserId,
  onDelete,
}: CommentItemProps) {
  const [showContent, setShowContent] = React.useState(false)

  // Format comment content to highlight mentions
  const formattedContent = React.useMemo(() => {
    const parts = comment.content.split(/(@\S+)/g)
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-primary font-medium">
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }, [comment.content])

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), {
        addSuffix: true,
        locale: enUS,
      })
    } catch {
      return ""
    }
  }, [comment.createdAt])

  const initials = comment.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="group flex gap-2">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p
          className={cn(
            "text-sm text-muted-foreground mt-0.5 leading-relaxed",
            !showContent && comment.content.length > 200 && "line-clamp-2"
          )}
          onClick={() => {
            if (comment.content.length > 200) setShowContent(!showContent)
          }}
          style={{ cursor: comment.content.length > 200 ? "pointer" : "default" }}
        >
          {formattedContent}
        </p>
        {comment.content.length > 200 && (
          <button
            className="text-xs text-primary hover:underline mt-0.5"
            onClick={() => setShowContent(!showContent)}
            type="button"
          >
            {showContent ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </div>
  )
}
