"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { IconEdit, IconTrash, IconCalendar, IconUser, IconChalkboardTeacher, IconSparkles } from "@tabler/icons-react"
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
  topic: string
  subtopic?: string | null
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
  onDelete: (id: string) => void
}

export default function DetailLessonPlan({
  selectedDate,
  lessonPlan,
  loading,
  onDelete,
}: DetailLessonPlanProps) {
  const router = useRouter()
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
        <CardHeader className="border-b pb-3 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="py-6 space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!selectedDate) {
    return (
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">Detail Rencana Pembelajaran</CardTitle>
          <CardDescription className="text-xs">
            Pilih tanggal untuk melihat detail rencana pembelajaran
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <IconCalendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground">
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
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">Detail Rencana Pembelajaran</CardTitle>
          <CardDescription className="text-xs">
            {format(selectedDate, "dd MMMM yyyy", { locale: id })}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Belum ada rencana pembelajaran untuk tanggal ini
            </p>
            <p className="text-[10px] text-muted-foreground">
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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title and Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base leading-tight">
                  {lessonPlan.topic}
                  {lessonPlan.subtopic && (
                    <span className="text-sm text-muted-foreground font-normal"> - {lessonPlan.subtopic}</span>
                  )}
                </CardTitle>
                {lessonPlan.code && (
                  <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                    {lessonPlan.code}
                  </Badge>
                )}
                {lessonPlan.generatedByAi && (
                  <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                    <IconSparkles className="mr-1 h-3 w-3" />
                    AI
                  </Badge>
                )}
              </div>
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <IconChalkboardTeacher className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{lessonPlan.classroomName || "Rombongan Belajar"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{format(new Date(lessonPlan.date), "dd MMM yyyy", { locale: id })}</span>
                </div>
                {lessonPlan.createdByName && (
                  <div className="flex items-center gap-1.5 md:col-span-2">
                    <IconUser className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{lessonPlan.createdByName}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/teacher/lesson-plan/${lessonPlan.id}/edit`)}
                title="Edit Rencana Pembelajaran"
                className="h-8 w-8 p-0"
              >
                <IconEdit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                title="Hapus Rencana Pembelajaran"
                className="h-8 w-8 p-0"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {lessonPlan.items && lessonPlan.items.length > 0 ? (
            <div className="border-t">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold w-8">#</th>
                      <th className="text-left p-2 font-semibold min-w-[120px]">Aspek</th>
                      <th className="text-left p-2 font-semibold">Tujuan Pembelajaran</th>
                      <th className="text-left p-2 font-semibold">Konteks & Aktivitas</th>
                      <th className="text-center p-2 font-semibold w-12">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonPlan.items.map((item, index) => (
                      <tr 
                        key={item.id || index} 
                        className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-2 align-top">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-[10px]">
                            {index + 1}
                          </div>
                        </td>
                        <td className="p-2 align-top">
                          <span className="font-medium leading-tight">
                            {getDevelopmentScopeLabel(item.developmentScope)}
                          </span>
                        </td>
                        <td className="p-2 align-top">
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {item.learningGoal}
                          </p>
                        </td>
                        <td className="p-2 align-top">
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {item.activityContext}
                          </p>
                        </td>
                        <td className="p-2 align-top text-center">
                          {item.generatedByAi && (
                            <div className="flex justify-center">
                              <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                <IconSparkles className="h-3 w-3" />
                              </Badge>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-t">
              <p className="text-xs text-muted-foreground">
                Tidak ada data aspek perkembangan
              </p>
            </div>
          )}

          {/* Metadata Footer */}
          {lessonPlan.createdAt && (
            <div className="px-3 py-2 border-t bg-muted/20">
              <p className="text-[10px] text-muted-foreground">
                Dibuat pada: {format(new Date(lessonPlan.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
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
