"use client"

import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { IconCheck, IconPencil } from "@tabler/icons-react"

export interface StudentAssessmentRow {
  id: string
  name: string
  isAssessed: boolean
  hasSummary: boolean
  hasPhoto: boolean
}

interface StudentAssessmentListProps {
  students: StudentAssessmentRow[]
  onEdit: (studentId: string) => void
}

export function StudentAssessmentList({ students, onEdit }: StudentAssessmentListProps) {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const pageCount = Math.max(1, Math.ceil(students.length / pageSize))
  const paginatedStudents = students.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const columns: ColumnDef<StudentAssessmentRow>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => (
          <span className="font-medium text-xs">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "isAssessed",
        header: "Capaian Pembelajaran",
        cell: ({ row }) =>
          row.getValue("isAssessed") ? (
            <IconCheck className="h-4 w-4 text-green-600" />
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        accessorKey: "hasSummary",
        header: "Ringkasan Penilaian",
        cell: ({ row }) =>
          row.getValue("hasSummary") ? (
            <IconCheck className="h-4 w-4 text-green-600" />
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        accessorKey: "hasPhoto",
        header: "Foto Aktivitas",
        cell: ({ row }) =>
          row.getValue("hasPhoto") ? (
            <IconCheck className="h-4 w-4 text-green-600" />
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant={row.original.isAssessed ? "outline" : "default"}
              size="sm"
              onClick={() => onEdit(row.original.id)}
              className="h-6 text-[11px] px-2"
            >
              {row.original.isAssessed ? (
                <>
                  <IconPencil className="h-3 w-3 mr-1" />
                  Ubah
                </>
              ) : (
                "Nilai"
              )}
            </Button>
          </div>
        ),
      },
    ],
    [onEdit]
  )

  return (
    <DataTable
      columns={columns}
      data={paginatedStudents}
      pageCount={pageCount}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalCount={students.length}
      onPageChange={(page) => setPageIndex(page)}
      onPageSizeChange={(size) => {
        setPageSize(size)
        setPageIndex(0)
      }}
      manualPagination
    />
  )
}
