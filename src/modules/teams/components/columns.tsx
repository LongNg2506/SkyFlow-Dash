"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, UserPlus, Users } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TeamWithMemberCount } from "../services/types/team-types"

interface TeamColumnActions {
  onAddMember?: (team: TeamWithMemberCount) => void
  canAddMember?: (team: TeamWithMemberCount) => boolean
  canManageTeam?: (team: TeamWithMemberCount) => boolean
}

export function getTeamColumns({
  onAddMember,
  canAddMember,
  canManageTeam,
}: TeamColumnActions = {}): ColumnDef<TeamWithMemberCount>[] {
  return [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Team</span>
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {row.original.description}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "memberCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Members</span>
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.memberCount} / {row.original.maxMembers}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? "default" : "secondary"}
        className={
          row.original.isActive
            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const canAdd = canAddMember?.(row.original) ?? Boolean(onAddMember)
      const canManage = canManageTeam?.(row.original) ?? canAdd

      return (
        <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2">
        {onAddMember && canAdd ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 cursor-pointer"
            onClick={() => onAddMember(row.original)}
          >
            <UserPlus className="mr-2 size-4" />
            Add Member
          </Button>
        ) : canAdd ? (
          <Button variant="outline" size="sm" asChild className="h-8 cursor-pointer">
            <Link href={`/teams/${row.original.id}/members`}>
              <UserPlus className="mr-2 size-4" />
              Add Member
            </Link>
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" asChild className="h-8 cursor-pointer">
          <Link href={`/teams/${row.original.id}`}>
            <Users className="mr-2 size-4" />
            Detail
          </Link>
        </Button>
        {canManage ? (
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem asChild>
              <Link href={`/teams/${row.original.id}`} className="cursor-pointer">
                View detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/teams/${row.original.id}/members`} className="cursor-pointer">
                Manage members
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/teams/${row.original.id}/edit`} className="cursor-pointer">
                Edit team
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      )
    },
  },
  ]
}

export const teamColumns = getTeamColumns()
