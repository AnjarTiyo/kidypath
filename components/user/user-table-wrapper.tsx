"use client"

import { useCallback, useEffect, useState } from "react"
import { SortingState } from "@tanstack/react-table"
import { UserTable } from "./user-table"
import { User } from "./user-columns"
import { UserTableSkeleton } from "./user-table-skeleton"
import { UserTableError } from "./user-table-error"
import { UserPageActions } from "./user-page-actions"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface UserTableWrapperProps {
  renderHeader?: (onRefresh: () => void) => React.ReactNode
}

export function UserTableWrapper({ renderHeader }: UserTableWrapperProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      if (search) {
        params.append("search", search)
      }

      if (roleFilter) {
        params.append("role", roleFilter)
      }

      if (sorting.length > 0) {
        params.append("sortBy", sorting[0].id)
        params.append("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const response = await fetch(`/api/users?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.data || [])
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, search, roleFilter, sorting])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const handleRoleFilterChange = (newRole: string) => {
    setRoleFilter(newRole)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (loading && users.length === 0) {
    return <UserTableSkeleton />
  }

  if (error && users.length === 0) {
    return <UserTableError message={error} onRetry={fetchUsers} />
  }

  return (
    <>
      {renderHeader && renderHeader(fetchUsers)}
      <div className="space-y-4">
        <UserTable
            data={users}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            onRoleFilterChange={handleRoleFilterChange}
            onSortingChange={handleSortingChange}
            sorting={sorting}
            onRefresh={fetchUsers}
            search={search}
            roleFilter={roleFilter}
          />
      </div>
    </>
  )
}

export { UserPageActions }
