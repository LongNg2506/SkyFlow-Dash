"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "./data-table-pagination"
import { MemberActions } from "./member-actions"
import { getMemberColumns } from "./member-columns"
import type { TeamMember, TeamRole } from "../services/types/team-types"

interface MembersTableProps {
  members: TeamMember[]
  currentUserUid: string
  currentUserRole: TeamRole
  onChangeRole: (uid: string, role: TeamRole) => Promise<void>
  onRemove: (uid: string) => Promise<void>
}

export function MembersTable({
  members,
  currentUserUid,
  currentUserRole,
  onChangeRole,
  onRemove,
}: MembersTableProps) {
  const [search, setSearch] = React.useState("")

  const columns = React.useMemo(
    (): ColumnDef<TeamMember>[] => [
      ...getMemberColumns(),
      {
        id: "actions",
        cell: ({ row }: { row: { original: TeamMember } }) => (
          <MemberActions
            member={row.original}
            currentUserUid={currentUserUid}
            currentUserRole={currentUserRole}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        ),
      },
    ],
    [currentUserUid, currentUserRole, onChangeRole, onRemove]
  )

  const table = useReactTable({
    data: members,
    columns,
    state: {
      globalFilter: search,
    },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm thành viên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50 text-sm">
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 text-left font-medium">
                    {h.isPlaceholder
                      ? null
                      : typeof h.column.columnDef.header === "string"
                        ? h.column.columnDef.header
                        : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy thành viên.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b transition-colors hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm align-middle">
                      {typeof cell.column.columnDef.cell === "function"
                        ? cell.column.columnDef.cell(cell.getContext())
                        : String(cell.getValue() ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
