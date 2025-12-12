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
} from "@/components/ui/alert-dialog"
import { Classroom } from "./classroom-columns"
import { IconLoader2 } from "@tabler/icons-react"

interface DeleteClassroomDialogProps {
  classroom: Classroom
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteClassroomDialog({
  classroom,
  open,
  onOpenChange,
  onSuccess,
}: DeleteClassroomDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Gagal menghapus kelas")
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      setError("Terjadi kesalahan saat menghapus kelas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus kelas <strong>{classroom.name}</strong> ({classroom.academicYear})?
            <br />
            <br />
            Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait
            termasuk siswa, agenda, dan penilaian.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
