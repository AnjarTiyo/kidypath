"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { IconEdit, IconTrash, IconCalendar, IconUser, IconRobot, IconChalkboardTeacher, IconSparkles } from "@tabler/icons-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getDevelopmentScopeLabel } from "@/lib/ai/lesson-plan-generator"

type DevelopmentScope = 'religious_moral' | 'physical_motor' | 'cognitive' | 'language' | 'social_emotional' | 'art';

interface LessonPlanItem {
  id: string
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface LessonPlan {
  id: string
  classroomId: string
  classroomName?: string
  date: string
  title: string
  code?: string | null
  generatedByAi?: boolean
  createdByName?: string
  createdAt?: string
  items: LessonPlanItem[]
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
        </CardHeader>
        <CardContent>
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
        <CardHeader >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <CardTitle className="text-lg">{lessonPlan.title}</CardTitle>
                {lessonPlan.code && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {lessonPlan.code}
                  </Badge>
                )}
                {lessonPlan.generatedByAi && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <IconRobot className="mr-1 h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1.5 text-sm grid grid-cols-2 w-full text-muted-foreground text-xs">
                <div className="flex items-center gap-2">
                  <IconChalkboardTeacher className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{lessonPlan.classroomName || "Rombongan Belajar"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCalendar className="h-4 w-4 shrink-0" />
                  <span>{format(new Date(lessonPlan.date), "EEEE, dd MMMM yyyy", { locale: id })}</span>
                </div>
                {lessonPlan.createdByName && (
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4 shrink-0" />
                    <span>Dibuat oleh: {lessonPlan.createdByName}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(lessonPlan)}
                title="Edit Rencana Pembelajaran"
              >
                <IconEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                title="Hapus Rencana Pembelajaran"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {lessonPlan.items && lessonPlan.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-semibold text-xs w-8">#</th>
                    <th className="text-left p-2 font-semibold text-xs">Aspek Perkembangan</th>
                    <th className="text-left p-2 font-semibold text-xs">Tujuan Pembelajaran</th>
                    <th className="text-left p-2 font-semibold text-xs">Konteks & Aktivitas</th>
                    <th className="text-center p-2 font-semibold text-xs w-20">AI</th>
                  </tr>
                </thead>
                <tbody>
                  {lessonPlan.items.map((item, index) => (
                    <tr 
                      key={item.id || index} 
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-2 align-top">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <span className="font-medium text-xs">
                          {getDevelopmentScopeLabel(item.developmentScope)}
                        </span>
                      </td>
                      <td className="p-2 align-top">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.learningGoal}
                        </p>
                      </td>
                      <td className="p-2 align-top">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.activityContext}
                        </p>
                      </td>
                      <td className="p-2 align-top text-center">
                        {item.generatedByAi && (
                          <Badge variant="secondary" className="text-xs">
                            <IconSparkles className="h-3 w-3" />
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                Tidak ada data aspek perkembangan
              </p>
            </div>
          )}

          {/* Metadata */}
          {lessonPlan.createdAt && (
            <div className="px-6 py-4 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Dibuat pada: {format(new Date(lessonPlan.createdAt), "dd MMMM yyyy, HH:mm", { locale: id })}
              </p>
            </div>
          )}
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
