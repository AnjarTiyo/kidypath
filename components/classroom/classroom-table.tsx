"use client"

import { useMemo } from "react"
import { SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { getClassroomColumns, Classroom } from "./classroom-columns"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { Card } from "../ui/card"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface ClassroomTableProps {
  data: Classroom[]
  pagination: PaginationData
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange: (search: string) => void
  onSortingChange: (sorting: SortingState) => void
  sorting: SortingState
  onRefresh: () => void
  search: string
}

export function ClassroomTable({
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortingChange,
  sorting,
  onRefresh,
  search,
}: ClassroomTableProps) {
  const columns = useMemo(() => getClassroomColumns(onRefresh), [onRefresh])

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kelas atau tahun ajaran..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        pageCount={pagination.totalPages}
        pageIndex={pagination.page - 1}
        pageSize={pagination.pageSize}
        totalCount={pagination.totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualPagination={true}
        manualSorting={true}
      />
    </Card>
  )
}
