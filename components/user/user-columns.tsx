"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { UserActions } from "./user-actions"

export type User = {
  id: string
  name: string | null
  email: string | null
  role: "admin" | "teacher" | "parent" | "curriculum" | null
  createdAt: Date | null
  updatedAt: Date | null
}

const roleVariants = {
  admin: "destructive",
  teacher: "default",
  parent: "secondary",
  curriculum: "chart-1",
} as const

const roleLabels = {
  admin: "Admin",
  teacher: "Guru",
  parent: "Orang Tua",
  curriculum: "Kurikulum",
}

export const getUserColumns = (onRefresh?: () => void): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string | null
      return <div className="font-medium">{name || "-"}</div>
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null
      return <div>{email || "-"}</div>
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as "admin" | "teacher" | "parent" | null
      if (!role) return <div>-</div>
      
      return (
        <Badge variant={roleVariants[role]}>
          {roleLabels[role]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dibuat" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date | null
      if (!date) return <div>-</div>
      
      return (
        <div className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} onRefresh={onRefresh} />,
  },
]
