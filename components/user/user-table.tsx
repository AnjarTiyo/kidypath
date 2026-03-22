"use client"

import { useMemo } from "react"
import { SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { getUserColumns, User } from "./user-columns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "../ui/card"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface UserTableProps {
  data: User[]
  pagination: PaginationData
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange: (search: string) => void
  onRoleFilterChange: (role: string) => void
  onSortingChange: (sorting: SortingState) => void
  sorting: SortingState
  onRefresh: () => void
  search: string
  roleFilter: string
}

export function UserTable({
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onRoleFilterChange,
  onSortingChange,
  sorting,
  onRefresh,
  search,
  roleFilter,
}: UserTableProps) {
  const columns = useMemo(() => getUserColumns(onRefresh), [onRefresh])

  return (
    <Card className="p-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Guru</SelectItem>
            <SelectItem value="parent">Orang Tua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        pageCount={pagination.totalPages}
        pageIndex={pagination.page - 1}
        pageSize={pagination.pageSize}
        totalCount={pagination.totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortingChange={onSortingChange}
        sorting={sorting}
        manualPagination
        manualSorting
      />
    </Card>
  )
}
