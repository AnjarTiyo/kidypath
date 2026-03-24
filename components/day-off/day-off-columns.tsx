"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { format, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { DayOffActions } from "./day-off-actions"

export type DayOff = {
  id: string
  date: string
  name: string
  createdByName: string | null
  createdAt: string
}

export function getDayOffColumns(onRefresh: () => void): ColumnDef<DayOff>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
      cell: ({ row }) => {
        try {
          return (
            <span className="font-medium">
              {format(parseISO(row.getValue("date")), "EEEE, d MMMM yyyy", { locale: idLocale })}
            </span>
          )
        } catch {
          return <span>{row.getValue("date")}</span>
        }
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Keterangan" />,
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      accessorKey: "createdByName",
      header: "Dibuat Oleh",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("createdByName") || "—"}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <DayOffActions dayOff={row.original} onRefresh={onRefresh} />,
    },
  ]
}
