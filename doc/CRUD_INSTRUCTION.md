# CRUD Entity Creation Instructions for AI Copilot

This document provides comprehensive guidelines for creating CRUD (Create, Read, Update, Delete) entities in the Ansara Jurnal application. Follow these instructions to maintain consistency and best practices across the codebase.

## Table of Contents
1. [Project Stack](#project-stack)
2. [Database Layer](#database-layer)
3. [API Routes](#api-routes)
4. [Type Definitions](#type-definitions)
5. [UI Components](#ui-components)
6. [Component Architecture](#component-architecture)
7. [Best Practices](#best-practices)
8. [Complete Example](#complete-example)

---

## Project Stack

- **Framework**: Next.js 16+ (App Router)
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Table**: TanStack Table (React Table v8)
- **Icons**: Tabler Icons
- **Authentication**: NextAuth.js
- **Runtime**: Bun

---

## Database Layer

### 1. Schema Definition

**Location**: `lib/db/schema.ts`

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const yourEntity = pgTable("your_entity", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // or use pgEnum
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Add foreign keys if needed
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
})
```

**Key Points**:
- Use `uuid` for primary keys with `defaultRandom()`
- Include `createdAt` and `updatedAt` timestamps
- Use `notNull()` for required fields
- Add foreign key constraints with proper `onDelete` behavior
- Consider using `pgEnum` for status fields

### 2. Migration

**Location**: `drizzle/`

```bash
# Generate migration
bun run drizzle-kit generate

# Apply migration
bun run db:migrate
```

### 3. Seed Data (Optional)

**Location**: `lib/db/seed.ts`

```typescript
export async function seedYourEntity() {
  await db.insert(yourEntity).values([
    {
      name: "Sample Entity 1",
      description: "Description for entity 1",
      status: "active",
    },
    // Add more seed data
  ])
}
```

---

## API Routes

### 1. List/Create Endpoint

**Location**: `app/api/your-entity/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { yourEntity } from "@/lib/db/schema"
import { desc, asc, sql, or, ilike, eq } from "drizzle-orm"

// GET - List with pagination, search, sorting, filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization (if needed)
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const statusFilter = searchParams.get("status") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(yourEntity.name, `%${search}%`),
          ilike(yourEntity.description, `%${search}%`)
        )
      )
    }

    if (statusFilter) {
      conditions.push(eq(yourEntity.status, statusFilter))
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(yourEntity)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)

    // Get paginated data
    const data = await db
      .select({
        id: yourEntity.id,
        name: yourEntity.name,
        description: yourEntity.description,
        status: yourEntity.status,
        createdAt: yourEntity.createdAt,
        updatedAt: yourEntity.updatedAt,
      })
      .from(yourEntity)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(
        sortOrder === "desc" 
          ? desc(yourEntity[sortBy as keyof typeof yourEntity]) 
          : asc(yourEntity[sortBy as keyof typeof yourEntity])
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const totalPages = Math.ceil(count / pageSize)

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount: count,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching entities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new entity
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, status } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check for duplicates (if needed)
    const [existing] = await db
      .select()
      .from(yourEntity)
      .where(eq(yourEntity.name, name))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: "Entity with this name already exists" },
        { status: 400 }
      )
    }

    // Create entity
    const [newEntity] = await db
      .insert(yourEntity)
      .values({
        name,
        description: description || null,
        status: status || "active",
      })
      .returning()

    return NextResponse.json(newEntity, { status: 201 })
  } catch (error) {
    console.error("Error creating entity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### 2. Single Item Endpoint

**Location**: `app/api/your-entity/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { yourEntity } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// GET - Get single entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [entity] = await db
      .select()
      .from(yourEntity)
      .where(eq(yourEntity.id, id))
      .limit(1)

    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    return NextResponse.json(entity)
  } catch (error) {
    console.error("Error fetching entity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update entity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, status } = body

    // Check if entity exists
    const [existingEntity] = await db
      .select()
      .from(yourEntity)
      .where(eq(yourEntity.id, id))
      .limit(1)

    if (!existingEntity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    // Check for duplicate name (if name is being changed)
    if (name && name !== existingEntity.name) {
      const [duplicate] = await db
        .select()
        .from(yourEntity)
        .where(eq(yourEntity.name, name))
        .limit(1)

      if (duplicate) {
        return NextResponse.json(
          { error: "Entity with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: {
      updatedAt: Date
      name?: string
      description?: string | null
      status?: string
    } = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (status !== undefined) updateData.status = status

    // Update entity
    const [updatedEntity] = await db
      .update(yourEntity)
      .set(updateData)
      .where(eq(yourEntity.id, id))
      .returning()

    return NextResponse.json(updatedEntity)
  } catch (error) {
    console.error("Error updating entity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if entity exists
    const [existingEntity] = await db
      .select()
      .from(yourEntity)
      .where(eq(yourEntity.id, id))
      .limit(1)

    if (!existingEntity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    // Delete entity
    await db.delete(yourEntity).where(eq(yourEntity.id, id))

    return NextResponse.json({ message: "Entity deleted successfully" })
  } catch (error) {
    console.error("Error deleting entity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

---

## Type Definitions

**Location**: `components/your-entity/your-entity-columns.tsx`

```typescript
export type YourEntity = {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}
```

---

## UI Components

### Component Structure

Create the following files in `components/your-entity/`:

1. `your-entity-columns.tsx` - Table column definitions
2. `your-entity-table.tsx` - Table component with filters
3. `your-entity-table-wrapper.tsx` - Data fetching wrapper
4. `your-entity-table-skeleton.tsx` - Loading skeleton
5. `your-entity-table-error.tsx` - Error state
6. `your-entity-form-dialog.tsx` - Create/Edit dialog
7. `your-entity-page-actions.tsx` - Page action buttons
8. `your-entity-management-page.tsx` - Main page component
9. `delete-your-entity-dialog.tsx` - Delete confirmation

### 1. Column Definitions

**File**: `your-entity-columns.tsx`

```typescript
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { YourEntityActions } from "./your-entity-actions"
import { formatDate } from "@/lib/utils"

export type YourEntity = {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export function getYourEntityColumns(
  onRefresh: () => void
): ColumnDef<YourEntity>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "inactive"
                ? "secondary"
                : "outline"
            }
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <YourEntityActions entity={row.original} onRefresh={onRefresh} />
      ),
    },
  ]
}
```

### 2. Table Component

**File**: `your-entity-table.tsx`

```typescript
"use client"

import { useMemo } from "react"
import { SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { getYourEntityColumns, YourEntity } from "./your-entity-columns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface YourEntityTableProps {
  data: YourEntity[]
  pagination: PaginationData
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange: (search: string) => void
  onStatusFilterChange: (status: string) => void
  onSortingChange: (sorting: SortingState) => void
  sorting: SortingState
  onRefresh: () => void
  search: string
  statusFilter: string
}

export function YourEntityTable({
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  onSortingChange,
  sorting,
  onRefresh,
  search,
  statusFilter,
}: YourEntityTableProps) {
  const columns = useMemo(() => getYourEntityColumns(onRefresh), [onRefresh])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
    </div>
  )
}
```

### 3. Table Wrapper

**File**: `your-entity-table-wrapper.tsx`

```typescript
"use client"

import { useCallback, useEffect, useState } from "react"
import { SortingState } from "@tanstack/react-table"
import { YourEntityTable } from "./your-entity-table"
import { YourEntity } from "./your-entity-columns"
import { YourEntityTableSkeleton } from "./your-entity-table-skeleton"
import { YourEntityTableError } from "./your-entity-table-error"

interface PaginationData {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface YourEntityTableWrapperProps {
  renderHeader?: (onRefresh: () => void) => React.ReactNode
}

export function YourEntityTableWrapper({ renderHeader }: YourEntityTableWrapperProps) {
  const [entities, setEntities] = useState<YourEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      if (search) {
        params.append("search", search)
      }

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      if (sorting.length > 0) {
        params.append("sortBy", sorting[0].id)
        params.append("sortOrder", sorting[0].desc ? "desc" : "asc")
      }

      const response = await fetch(`/api/your-entity?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch entities")
      }

      const data = await response.json()
      setEntities(data.data || [])
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      console.error("Error fetching entities:", err)
      setError("Failed to load entities. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, search, statusFilter, sorting])

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

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

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (loading && entities.length === 0) {
    return <YourEntityTableSkeleton />
  }

  if (error && entities.length === 0) {
    return <YourEntityTableError message={error} onRetry={fetchEntities} />
  }

  return (
    <>
      {renderHeader && renderHeader(fetchEntities)}
      <div className="space-y-4">
        <YourEntityTable
          data={entities}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortingChange={handleSortingChange}
          sorting={sorting}
          onRefresh={fetchEntities}
          search={search}
          statusFilter={statusFilter}
        />
      </div>
    </>
  )
}
```

### 4. Loading Skeleton

**File**: `your-entity-table-skeleton.tsx`

```typescript
import { Skeleton } from "@/components/ui/skeleton"

export function YourEntityTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="space-y-4 pb-6 border-b">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Title and Actions */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-sm border">
        {/* Table Header */}
        <div className="border-b bg-muted/50">
          <div className="flex items-center h-12 px-4 gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b last:border-b-0">
            <div className="flex items-center h-16 px-4 gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 5. Error State

**File**: `your-entity-table-error.tsx`

```typescript
import { Button } from "@/components/ui/button"
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react"

interface YourEntityTableErrorProps {
  message?: string
  onRetry?: () => void
}

export function YourEntityTableError({ 
  message = "Failed to load entities. Please try again.",
  onRetry 
}: YourEntityTableErrorProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-destructive/20 p-3">
            <IconAlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Error Loading Data</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {message}
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 6. Form Dialog

**File**: `your-entity-form-dialog.tsx`

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { YourEntity } from "./your-entity-columns"

interface YourEntityFormDialogProps {
  entity?: YourEntity
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function YourEntityFormDialog({ 
  entity, 
  open, 
  onOpenChange, 
  onSuccess 
}: YourEntityFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: entity?.name || "",
    description: entity?.description || "",
    status: entity?.status || "active",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!entity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = isEdit ? `/api/your-entity/${entity.id}` : "/api/your-entity"
      const method = isEdit ? "PATCH" : "POST"

      const body: {
        name: string
        description: string
        status: string
      } = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error) {
          setErrors({ general: data.error })
        }
        setLoading(false)
        return
      }

      // Reset form and close dialog
      setFormData({ name: "", description: "", status: "active" })
      onOpenChange(false)
      
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving entity:", error)
      setErrors({ general: "An error occurred while saving the entity" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Entity" : "Create New Entity"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Make changes to the entity here. Click save when you&apos;re done."
                : "Add a new entity to the system. Fill in all required fields."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errors.general && (
              <div className="text-sm text-destructive">{errors.general}</div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Entity name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Entity description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 7. Delete Dialog

**File**: `delete-your-entity-dialog.tsx`

```typescript
"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialog"
import { YourEntity } from "./your-entity-columns"

interface DeleteYourEntityDialogProps {
  entity: YourEntity
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteYourEntityDialog({
  entity,
  open,
  onOpenChange,
  onSuccess,
}: DeleteYourEntityDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/your-entity/${entity.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete entity")
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error deleting entity:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{entity.name}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 8. Entity Actions

**File**: `your-entity-actions.tsx`

```typescript
"use client"

import { useState } from "react"
import { IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { YourEntity } from "./your-entity-columns"
import { YourEntityFormDialog } from "./your-entity-form-dialog"
import { DeleteYourEntityDialog } from "./delete-your-entity-dialog"

interface YourEntityActionsProps {
  entity: YourEntity
  onRefresh: () => void
}

export function YourEntityActions({ entity, onRefresh }: YourEntityActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <YourEntityFormDialog
        entity={entity}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onRefresh}
      />

      <DeleteYourEntityDialog
        entity={entity}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
```

### 9. Page Actions

**File**: `your-entity-page-actions.tsx`

```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { YourEntityFormDialog } from "./your-entity-form-dialog"

interface YourEntityPageActionsProps {
  onRefresh?: () => void
}

export function YourEntityPageActions({ onRefresh }: YourEntityPageActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <IconPlus className="mr-2 h-4 w-4" />
        Add Entity
      </Button>

      <YourEntityFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
```

### 10. Management Page

**File**: `your-entity-management-page.tsx`

```typescript
"use client"

import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconYourIcon } from "@tabler/icons-react"
import { YourEntityTableWrapper } from "./your-entity-table-wrapper"
import { YourEntityPageActions } from "./your-entity-page-actions"

export function YourEntityManagementPage() {
  return (
    <YourEntityTableWrapper
      renderHeader={(onRefresh) => (
        <PageHeader
          title="Entity Management"
          description="Manage your entities"
          breadcrumbs={[
            { label: "Home", href: "/admin", icon: IconHome },
            { label: "Entity Management", icon: IconYourIcon },
          ]}
          actions={<YourEntityPageActions onRefresh={onRefresh} />}
        />
      )}
    />
  )
}
```

---

## Component Architecture

### Directory Structure

```
app/
├── admin/
│   └── your-entity/
│       └── page.tsx
├── api/
│   └── your-entity/
│       ├── route.ts
│       └── [id]/
│           └── route.ts
components/
└── your-entity/
    ├── your-entity-columns.tsx
    ├── your-entity-table.tsx
    ├── your-entity-table-wrapper.tsx
    ├── your-entity-table-skeleton.tsx
    ├── your-entity-table-error.tsx
    ├── your-entity-form-dialog.tsx
    ├── your-entity-page-actions.tsx
    ├── your-entity-management-page.tsx
    ├── your-entity-actions.tsx
    └── delete-your-entity-dialog.tsx
```

### Page Component

**File**: `app/admin/your-entity/page.tsx`

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { YourEntityManagementPage } from "@/components/your-entity/your-entity-management-page"

export default async function AdminYourEntityPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  return <YourEntityManagementPage />
}
```

---

## Best Practices

### 1. Naming Conventions
- Use kebab-case for file names: `your-entity-table.tsx`
- Use PascalCase for component names: `YourEntityTable`
- Use camelCase for functions and variables: `fetchYourEntity`
- Use SCREAMING_SNAKE_CASE for constants: `MAX_PAGE_SIZE`

### 2. Type Safety
- Always define TypeScript types for entities
- Use proper type annotations for API responses
- Avoid using `any` type; use specific types or `unknown`
- Define proper return types for functions

### 3. Error Handling
- Always wrap API calls in try-catch blocks
- Provide user-friendly error messages
- Log errors to console for debugging
- Show retry options for failed requests

### 4. Authentication & Authorization
- Check authentication on all protected routes
- Verify user roles before allowing operations
- Return appropriate HTTP status codes (401, 403)
- Use NextAuth session for user information

### 5. Performance
- Use server components for initial data loading when possible
- Implement proper pagination (avoid loading all data at once)
- Use React.memo and useMemo for expensive operations
- Debounce search inputs to reduce API calls

### 6. UX Considerations
- Show loading skeletons that match the actual layout
- Provide clear feedback for all user actions
- Use confirmation dialogs for destructive actions
- Display helpful error messages with retry options
- Keep forms simple with clear validation messages

### 7. Code Organization
- Separate concerns: data fetching, presentation, business logic
- Create reusable components
- Keep components focused and single-responsibility
- Use proper file structure and naming

### 8. Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Provide screen reader support

---

## Complete Example

### Creating a "Class" Entity

1. **Database Schema** (`lib/db/schema.ts`):
```typescript
export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull().default(20),
  status: text("status").notNull().default("active"),
  teacherId: uuid("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
```

2. **API Routes**: Follow the structure in the API Routes section

3. **Components**: Create all 10 component files as outlined above

4. **Page**: Create the page component in `app/admin/classes/page.tsx`

---

## Checklist

When creating a new CRUD entity, ensure you complete:

- [ ] Database schema defined in `lib/db/schema.ts`
- [ ] Migration generated and applied
- [ ] API route for list/create (`route.ts`)
- [ ] API route for get/update/delete (`[id]/route.ts`)
- [ ] Column definitions component
- [ ] Table component with filters
- [ ] Table wrapper with data fetching
- [ ] Loading skeleton component
- [ ] Error state component
- [ ] Form dialog component
- [ ] Delete dialog component
- [ ] Entity actions component
- [ ] Page actions component
- [ ] Management page component
- [ ] Page component with authentication
- [ ] Type definitions exported
- [ ] Proper error handling
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] Input validation
- [ ] Loading states
- [ ] Success feedback
- [ ] Responsive design

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

## Notes

- Always test CRUD operations thoroughly
- Consider edge cases (empty states, long text, special characters)
- Implement proper loading and error states
- Use optimistic updates when appropriate
- Consider implementing soft deletes for important data
- Add audit logs for sensitive operations
- Implement proper data validation on both client and server
- Use transactions for complex operations
- Consider caching strategies for frequently accessed data
- Implement proper indexes on database columns used for filtering/sorting
