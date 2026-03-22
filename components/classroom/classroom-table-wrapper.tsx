"use client"

import { useCallback, useEffect, useState } from "react"
import { SortingState } from "@tanstack/react-table"
import { ClassroomTable } from "./classroom-table"
import { Classroom } from "./classroom-columns"
import { ClassroomTableSkeleton } from "./classroom-table-skeleton"
import { ClassroomTableError } from "./classroom-table-error"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface ClassroomTableWrapperProps {
  renderHeader?: (onRefresh: () => void) => React.ReactNode
}

export function ClassroomTableWrapper({ renderHeader }: ClassroomTableWrapperProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
      })

      if (sorting.length > 0) {
        params.append("sortBy", sorting[0].id)
        params.append("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const response = await fetch(`/api/classrooms?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch classrooms")
      }

      const result = await response.json()
      setClassrooms(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, search, sorting])

  useEffect(() => {
    fetchClassrooms()
  }, [fetchClassrooms])

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }))
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }))
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (loading && classrooms.length === 0) {
    return <ClassroomTableSkeleton />
  }

  if (error && classrooms.length === 0) {
    return <ClassroomTableError message={error} onRetry={fetchClassrooms} />
  }

  return (
    <>
      {renderHeader && renderHeader(fetchClassrooms)}
      <ClassroomTable
        data={classrooms}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortingChange={handleSortingChange}
        sorting={sorting}
        onRefresh={fetchClassrooms}
        search={search}
      />
    </>
  )
}
