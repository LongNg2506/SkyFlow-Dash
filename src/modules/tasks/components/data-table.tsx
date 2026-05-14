"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { Task } from "@/modules/tasks/services/types/task-types"
import type { Team } from "@/modules/teams/services/types/team-types"
import type { SystemRole } from "@/modules/users/services/types/user-types"
import type { UserTeamRole } from "@/modules/tasks/services/task-services"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddTask?: (task: Task) => void | Promise<void>
  onUpdateTask?: (task: Task) => void | Promise<void>
  onSeedTasks?: () => void | Promise<void>
  isSeedingTasks?: boolean
  teams?: Team[]
  systemRole?: SystemRole
  currentUserUid?: string
  teamRoles?: UserTeamRole[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onAddTask,
  onUpdateTask,
  onSeedTasks,
  isSeedingTasks,
  teams = [],
  systemRole,
  currentUserUid,
  teamRoles,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const statusFilter = columnFilters.find((filter) => filter.id === "status")
    ?.value
  const tableData = React.useMemo(
    () =>
      statusFilter === "done"
        ? data
        : data.filter((item) => (item as Task).status !== "done"),
    [data, statusFilter]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: (row) =>
      systemRole === "Admin" ||
      systemRole === "Manager" ||
      (row.original as Task).status !== "done",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onSeedTasks={onSeedTasks}
        isSeedingTasks={isSeedingTasks}
        teams={teams}
        systemRole={systemRole}
        currentUserUid={currentUserUid}
        teamRoles={teamRoles}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
