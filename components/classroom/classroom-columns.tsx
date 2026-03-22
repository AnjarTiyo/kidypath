"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { ClassroomActions } from "./classroom-actions"

export type Classroom = {
  id: string
  name: string
  academicYear: string
  teachers: Array<{ id: string; name: string }>
  teacherIds: string[]
  createdAt: Date
}

export function getClassroomColumns(
  onRefresh: () => void
): ColumnDef<Classroom>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama Kelas" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tahun Ajaran" />
      ),
      cell: ({ row }) => {
        return (
          <Badge variant="outline">
            {row.getValue("academicYear")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "teachers",
      header: "Guru Kelas",
      cell: ({ row }) => {
        const teachers = row.original.teachers
        return (
          <div className="flex flex-wrap gap-1">
            {teachers && teachers.length > 0 ? (
              teachers.map(teacher => (
                <Badge key={teacher.id} variant="secondary">
                  {teacher.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Belum ditugaskan</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dibuat Pada" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return (
          <div className="text-muted-foreground">
            {date.toLocaleDateString("id-ID", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ClassroomActions classroom={row.original} onRefresh={onRefresh} />
      ),
    },
  ]
}
