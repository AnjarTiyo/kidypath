"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSortingChange?: (sorting: SortingState) => void
  sorting?: SortingState
  onRowClick?: (row: TData) => void
  manualPagination?: boolean
  manualSorting?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 0,
  pageIndex = 0,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  sorting: externalSorting,
  onRowClick,
  manualPagination = false,
  manualSorting = false,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const sorting = React.useMemo(
    () => (manualSorting ? externalSorting || [] : internalSorting),
    [manualSorting, externalSorting, internalSorting]
  )

  const handleSortingChange = React.useCallback(
    (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue
      
      if (manualSorting && onSortingChange) {
        onSortingChange(newSorting)
      } else {
        setInternalSorting(newSorting)
      }
    },
    [sorting, manualSorting, onSortingChange]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination,
    manualSorting,
    pageCount: manualPagination ? pageCount : undefined,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: manualPagination
        ? { pageIndex, pageSize }
        : undefined,
    },
  })

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      table.setPageIndex(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize)
    } else {
      table.setPageSize(newPageSize)
    }
  }

  const currentPageIndex = manualPagination ? pageIndex : table.getState().pagination.pageIndex
  const currentPageSize = manualPagination ? pageSize : table.getState().pagination.pageSize
  const currentPageCount = manualPagination ? pageCount : table.getPageCount()
  const canPreviousPage = currentPageIndex > 0
  const canNextPage = currentPageIndex < currentPageCount - 1

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {manualPagination ? (
            <span className="text-xs">
              Menampilkan {currentPageIndex * currentPageSize + 1} dari{" "}
                  {Math.min((currentPageIndex + 1) * currentPageSize, totalCount)}
            </span>
          ) : (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium">Baris per hal.</p>
            <Select
              value={`${currentPageSize}`}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={currentPageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex w-[100px] items-center justify-center text-xs font-medium">
              Hal. {currentPageIndex + 1} dari {currentPageCount || 1}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                className="h-8 w-8 p-0 hidden sm:flex"
                onClick={() => handlePageChange(0)}
                disabled={!canPreviousPage}
              >
                <span className="sr-only text-xs">Ke hal. pertama</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(currentPageIndex - 1)}
                disabled={!canPreviousPage}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(currentPageIndex + 1)}
                disabled={!canNextPage}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 hidden sm:flex"
                onClick={() => handlePageChange(currentPageCount - 1)}
                disabled={!canNextPage}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
