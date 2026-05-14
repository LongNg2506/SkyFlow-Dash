"use client"

import { useMemo, useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  EllipsisVertical,
  Eye,
  ListTodo,
  Pencil,
  Search,
  ShieldOff,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserFormDialog } from "./user-form-dialog"
import type {
  UserFormValues,
  UserWithStats,
} from "@/modules/users/services/types/user-types"

const TEAM_ROLE_BADGE_CLASS: Record<string, string> = {
  Leader: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Vice Leader": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

interface DataTableProps {
  users: UserWithStats[]
  onDeactivateUser: (uid: string) => void | Promise<void>
  onEditUser: (user: UserWithStats, values: UserFormValues) => void | Promise<void>
  onAddUser: (userData: UserFormValues) => void | Promise<void>
}

export function DataTable({
  users,
  onDeactivateUser,
  onEditUser,
  onAddUser,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [confirmUser, setConfirmUser] = useState<UserWithStats | null>(null)

  const columns = useMemo<ColumnDef<UserWithStats>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "User",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-medium">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium">{user.displayName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {user.uid}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "systemRole",
        header: "System Role",
        cell: ({ row }) => (
          <Badge
            variant={row.original.systemRole === "Admin" ? "default" : "secondary"}
            className={
              row.original.systemRole === "Manager"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                : undefined
            }
          >
            {row.original.systemRole}
          </Badge>
        ),
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: "teamNames",
        header: "Teams",
        cell: ({ row }) => {
          const teamNames = row.original.teamNames
          if (row.original.systemRole === "Admin" || row.original.systemRole === "Manager") {
            return <span className="text-sm text-muted-foreground">Management role</span>
          }
          return teamNames[0] ? (
            <Badge variant="outline" className="max-w-[220px] truncate">
              {teamNames[0]}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">No teams</span>
          )
        },
      },
      {
        accessorKey: "teamRoles",
        header: "Team Role",
        cell: ({ row }) => {
          const user = row.original
          if (user.systemRole === "Admin" || user.systemRole === "Manager") {
            return <span className="text-sm text-muted-foreground">Management role</span>
          }

          const teamRole = user.teamRoles[0]
          return teamRole ? (
            <Badge
              className={TEAM_ROLE_BADGE_CLASS[teamRole.role] ?? TEAM_ROLE_BADGE_CLASS.Member}
            >
              {teamRole.role}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">No team role</span>
          )
        },
      },
      {
        accessorKey: "assignedTasks",
        header: "Assigned Tasks",
        cell: ({ row }) => (
          row.original.systemRole === "Admin" || row.original.systemRole === "Manager" ? (
            <span className="text-sm text-muted-foreground">Not assigned</span>
          ) : (
            <span className="font-medium">{row.original.assignedTasks}</span>
          )
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              variant="secondary"
              className={
                status === "Active"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  : status === "Pending"
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400"
              }
            >
              {status}
            </Badge>
          )
        },
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                <Eye className="size-4" />
                <span className="sr-only">View user</span>
              </Button>
              <UserFormDialog
                user={user}
                onSubmitUser={(values) => onEditUser(user, values)}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit user</span>
                  </Button>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                    <EllipsisVertical className="size-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <ListTodo className="mr-2 size-4" />
                    View Assigned Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Users className="mr-2 size-4" />
                    View Teams
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    disabled={user.status === "Inactive"}
                    onClick={() => setConfirmUser(user)}
                  >
                    <ShieldOff className="mr-2 size-4" />
                    Deactivate User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [onDeactivateUser, onEditUser]
  )

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  const roleFilter = table.getColumn("systemRole")?.getFilterValue() as string
  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-9"
          />
        </div>
        <UserFormDialog onSubmitUser={onAddUser} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          value={roleFilter || "all"}
          onValueChange={(value) =>
            table.getColumn("systemRole")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="System Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="User">User</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} user(s)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactivate user?</DialogTitle>
            <DialogDescription>
              This keeps the account record but prevents it from being selected for new team membership.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setConfirmUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirmUser) return
                await onDeactivateUser(confirmUser.uid)
                setConfirmUser(null)
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
