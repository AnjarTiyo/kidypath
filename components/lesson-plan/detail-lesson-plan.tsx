"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { IconEdit, IconTrash, IconCalendar, IconUser, IconRobot, IconChalkboardTeacher } from "@tabler/icons-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface LessonPlan {
  id: string
  classroomId: string
  classroomName?: string
  date: string
  title: string
  code?: string | null
  content: string
  generatedByAi?: boolean
  createdByName?: string
  createdAt?: string
}

interface DetailLessonPlanProps {
  selectedDate: Date | undefined
  lessonPlan: LessonPlan | null
  loading: boolean
  onEdit: (lessonPlan: LessonPlan) => void
  onDelete: (id: string) => void
}

export default function DetailLessonPlan({
  selectedDate,
  lessonPlan,
  loading,
  onEdit,
  onDelete,
}: DetailLessonPlanProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!lessonPlan) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/lesson-plans/${lessonPlan.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(lessonPlan.id)
        setDeleteDialogOpen(false)
      } else {
        console.error("Failed to delete lesson plan")
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="border-b space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!selectedDate) {
    return (
      <Card>
        <CardHeader className="border-b h-18 flex-1">
          <CardTitle className="text-base">Detail Rencana Pembelajaran</CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            Pilih tanggal untuk melihat detail rencana pembelajaran
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center">
            <IconCalendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Klik tanggal pada kalender untuk melihat atau membuat rencana pembelajaran
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!lessonPlan) {
    return (
      <Card>
        <CardHeader className="border-b h-auto flex flex-row items-center gap-2 justify-between">
          <div id="title" className="flex flex-col">
            <CardTitle className="text-base">Detail Rencana Pembelajaran</CardTitle>
            <CardDescription className="text-xs">
              {format(selectedDate, "PPP", { locale: id })}
            </CardDescription>
          </div>
          {/* <Button>
            {lessonPlan.classroomName}
          </Button> */}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Belum ada rencana pembelajaran untuk tanggal ini
            </p>
            <p className="text-xs text-muted-foreground">
              Klik tombol &quot;Buat Rencana Pembelajaran&quot; untuk membuat rencana baru
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b h-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">Aktivitas: {lessonPlan.title}</CardTitle>
                {lessonPlan.code && (
                  <Badge variant="outline" className="text-xs">
                    {lessonPlan.code}
                  </Badge>
                )}
                {lessonPlan.generatedByAi && (
                  <Badge variant="secondary" className="text-xs">
                    <IconRobot className="mr-1 h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm flex items-center gap-2">
                <IconChalkboardTeacher className="h-4 w-4" />
                {lessonPlan.classroomName || "Rombongan Belajar"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(lessonPlan)}
              >
                <IconEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4" />
              <span>{format(new Date(lessonPlan.date), "PPP", { locale: id })}</span>
            </div>
            {lessonPlan.createdByName && (
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                <span>{lessonPlan.createdByName}</span>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none mb-10">
            <span className="font-semibold text-sm">Deskripsi:</span>
            <div className="whitespace-pre-wrap text-sm">{lessonPlan.content}</div>
          </div>
          <div className="prose prose-sm max-w-none">
            <span className="font-semibold text-sm">Media:</span>
            {/* TODO: implement add media */}
            <div className="whitespace-pre-wrap text-sm">-</div>
          </div>
          <div className="prose prose-sm max-w-none">
            <span className="font-semibold text-sm">Referensi:</span>
            {/* TODO: implement add media */}
            <div className="whitespace-pre-wrap text-sm">-</div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rencana Pembelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Rencana pembelajaran akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
