"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { IconMars, IconUsersGroup, IconVenus } from "@tabler/icons-react"
import { StudentActions } from "./student-actions"

export type Student = {
  id: string
  fullName: string
  birthDate: string | null
  gender: string
  classroomId: string | null
  classroomName: string | null
  parents: Array<{
    id: string
    name: string | null
    email: string | null
  }>
  createdAt: Date
}

export function getStudentColumns(
  onRefresh: () => void
): ColumnDef<Student>[] {
  return [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama Lengkap" />
      ),
      cell: ({ row }) => {
        const gender = row.original.gender
        return (
          <div className="flex items-center gap-2">
            {gender === "male" ? (
              <IconMars className="h-4 w-4 text-blue-500" />
            ) : (
              <IconVenus className="h-4 w-4 text-pink-500" />
            )}
            <span className="font-medium">{row.getValue("fullName")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "birthDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tanggal Lahir" />
      ),
      cell: ({ row }) => {
        const birthDate = row.getValue("birthDate") as string | null
        if (!birthDate) return <span className="text-muted-foreground">-</span>
        
        const date = new Date(birthDate)
        const age = Math.floor(
          (new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
        
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString("id-ID", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}</div>
            <div className="text-muted-foreground">{age} tahun</div>
          </div>
        )
      },
    },
    {
      accessorKey: "classroomName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kelas" />
      ),
      cell: ({ row }) => {
        const classroomName = row.getValue("classroomName") as string | null
        return classroomName ? (
          <Badge variant="outline">
            <IconUsersGroup className="mr-1 inline h-4 w-4" />
            {classroomName}
          </Badge>
        ) : (
          <span className="text-muted-foreground">Belum ditugaskan</span>
        )
      },
    },
    {
      accessorKey: "parents",
      header: "Orang Tua",
      cell: ({ row }) => {
        const parents = row.original.parents
        return (
          <div className="flex flex-wrap gap-1">
            {parents && parents.length > 0 ? (
              parents.map(parent => (
                <Badge key={parent.id} variant="secondary" className="text-xs">
                  {parent.name || parent.email}
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
          <div className="text-sm text-muted-foreground">
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
        <StudentActions student={row.original} onRefresh={onRefresh} />
      ),
    },
  ]
}
