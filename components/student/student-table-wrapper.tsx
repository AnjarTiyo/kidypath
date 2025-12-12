"use client"

import { useCallback, useEffect, useState } from "react"
import { SortingState } from "@tanstack/react-table"
import { StudentTable } from "./student-table"
import { Student } from "./student-columns"
import { StudentTableSkeleton } from "./student-table-skeleton"
import { StudentTableError } from "./student-table-error"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface StudentTableWrapperProps {
  renderHeader?: (onRefresh: () => void) => React.ReactNode
}

export function StudentTableWrapper({ renderHeader }: StudentTableWrapperProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [classroomFilter, setClassroomFilter] = useState<string>("all")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [sorting, setSorting] = useState<SortingState>([])
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string }>>([])

  const fetchClassrooms = useCallback(async () => {
    try {
      const response = await fetch("/api/classrooms?pageSize=100")
      if (!response.ok) throw new Error("Failed to fetch classrooms")
      const result = await response.json()
      setClassrooms(result.data || [])
    } catch (err) {
      console.error("Error fetching classrooms:", err)
    }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        classroom: classroomFilter,
        gender: genderFilter,
      })

      if (sorting.length > 0) {
        params.append("sortBy", sorting[0].id)
        params.append("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const response = await fetch(`/api/students?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const result = await response.json()
      setStudents(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching students:", err)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, search, classroomFilter, genderFilter, sorting])

  useEffect(() => {
    fetchClassrooms()
  }, [fetchClassrooms])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

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

  const handleClassroomFilterChange = (newClassroom: string) => {
    setClassroomFilter(newClassroom)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleGenderFilterChange = (newGender: string) => {
    setGenderFilter(newGender)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (loading && students.length === 0) {
    return <StudentTableSkeleton />
  }

  if (error && students.length === 0) {
    return <StudentTableError message={error} onRetry={fetchStudents} />
  }

  return (
    <>
      {renderHeader && renderHeader(fetchStudents)}
      <StudentTable
        data={students}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onClassroomFilterChange={handleClassroomFilterChange}
        onGenderFilterChange={handleGenderFilterChange}
        onSortingChange={handleSortingChange}
        sorting={sorting}
        onRefresh={fetchStudents}
        search={search}
        classroomFilter={classroomFilter}
        genderFilter={genderFilter}
        classrooms={classrooms}
      />
    </>
  )
}
