"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getDayOffColumns, DayOff } from "./day-off-columns"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { Card } from "@/components/ui/card"

interface DayOffTableProps {
  data: DayOff[]
  onRefresh: () => void
  search: string
  onSearchChange: (v: string) => void
}

export function DayOffTable({ data, onRefresh, search, onSearchChange }: DayOffTableProps) {
  const columns = useMemo(() => getDayOffColumns(onRefresh), [onRefresh])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (d) => d.name.toLowerCase().includes(q) || d.date.includes(q)
    )
  }, [data, search])

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari keterangan atau tanggal..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} />
    </Card>
  )
}
