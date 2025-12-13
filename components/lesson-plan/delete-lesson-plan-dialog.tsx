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

interface DeleteLessonPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonPlanId: string
  onSuccess: () => void
}

export function DeleteLessonPlanDialog({
  open,
  onOpenChange,
  lessonPlanId,
  onSuccess,
}: DeleteLessonPlanDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        console.error("Failed to delete lesson plan")
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Rencana Pembelajaran?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Rencana pembelajaran akan dihapus
            secara permanen dari sistem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
