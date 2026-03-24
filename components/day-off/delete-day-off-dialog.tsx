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
import { DayOff } from "./day-off-columns"
import { IconLoader2 } from "@tabler/icons-react"

interface DeleteDayOffDialogProps {
  dayOff: DayOff
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteDayOffDialog({ dayOff, open, onOpenChange, onSuccess }: DeleteDayOffDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/day-offs/${dayOff.id}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Gagal menghapus hari libur")
        return
      }
      onSuccess()
      onOpenChange(false)
    } catch {
      setError("Terjadi kesalahan saat menghapus hari libur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Hari Libur</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus hari libur{" "}
            <span className="font-semibold">{dayOff.name}</span>? Tindakan ini tidak dapat
            dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive px-1">{error}</p>}
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
