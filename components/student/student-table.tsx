"use client"

import { useMemo } from "react"
import { SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { getStudentColumns, Student } from "./student-columns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconSearch } from "@tabler/icons-react"
import { Card } from "../ui/card"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface StudentTableProps {
  data: Student[]
  pagination: PaginationData
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange: (search: string) => void
  onClassroomFilterChange: (classroom: string) => void
  onGenderFilterChange: (gender: string) => void
  onSortingChange: (sorting: SortingState) => void
  sorting: SortingState
  onRefresh: () => void
  search: string
  classroomFilter: string
  genderFilter: string
  classrooms: Array<{ id: string; name: string }>
}

export function StudentTable({
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onClassroomFilterChange,
  onGenderFilterChange,
  onSortingChange,
  sorting,
  onRefresh,
  search,
  classroomFilter,
  genderFilter,
  classrooms,
}: StudentTableProps) {
  const columns = useMemo(() => getStudentColumns(onRefresh), [onRefresh])

  return (
    <Card className="p-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={classroomFilter} onValueChange={onClassroomFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classrooms.map((classroom) => (
              <SelectItem key={classroom.id} value={classroom.id}>
                {classroom.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={onGenderFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Jenis Kelamin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="male">Laki-laki</SelectItem>
            <SelectItem value="female">Perempuan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
