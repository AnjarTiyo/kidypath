"use client"

import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconCheck } from "@tabler/icons-react"
import { getDevelopmentScopeLabel } from "@/lib/ai/lesson-plan-generator"
import type { ActivityPhase } from "@/components/lesson-plan/lesson-plan-activities-card"

export type DevelopmentScope =
  | "religious_moral"
  | "physical_motor"
  | "cognitive"
  | "language"
  | "social_emotional"
  | "art"

export interface LessonPlanItem {
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

export interface SavedLessonPlanActivity {
  phase: ActivityPhase
  description: string
  durationMinutes: number | null
}

export interface SavedLessonPlan {
  id: string
  classroomId: string
  date: string
  topic: string
  subtopic?: string | null
  code?: string | null
  materials?: string | null
  generatedByAi: boolean
  items: LessonPlanItem[]
  activities: SavedLessonPlanActivity[]
}

const ACTIVITY_PHASE_LABELS: Record<ActivityPhase, string> = {
  kegiatan_awal: "Kegiatan Awal",
  kegiatan_inti: "Kegiatan Inti",
  istirahat: "Istirahat",
  kegiatan_penutup: "Kegiatan Penutup",
  refleksi: "Refleksi Guru",
}

export function LessonPlanPreview({
  lessonPlan,
  classroomName,
  onFinish,
}: {
  lessonPlan: SavedLessonPlan
  classroomName?: string
  onFinish: () => void
}) {
  const formattedDate = (() => {
    try {
      return format(new Date(lessonPlan.date), "EEEE, dd MMMM yyyy", { locale: localeId })
    } catch {
      return lessonPlan.date
    }
  })()

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <IconCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Rencana Pembelajaran Berhasil Disimpan</p>
              <p className="text-xs text-muted-foreground">
                {classroomName} · {formattedDate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Informasi Pembelajaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Tema</p>
                <p className="font-medium">{lessonPlan.topic}</p>
              </div>
              {lessonPlan.subtopic && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Sub-Tema</p>
                  <p className="font-medium">{lessonPlan.subtopic}</p>
                </div>
              )}
              {lessonPlan.code && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">Kode</p>
                  <p className="font-medium">{lessonPlan.code}</p>
                </div>
              )}
            </div>
            {lessonPlan.generatedByAi && (
              <Badge variant="secondary" className="text-[10px]">AI Generated</Badge>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        {lessonPlan.materials && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Alat dan Bahan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs whitespace-pre-wrap">{lessonPlan.materials}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rincian Agenda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rincian Agenda</CardTitle>
          <CardDescription className="text-xs">Tujuan pembelajaran per aspek perkembangan</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold w-[140px]">Aspek</th>
                  <th className="text-left p-3 font-semibold">Tujuan Pembelajaran</th>
                  <th className="text-left p-3 font-semibold">Konteks &amp; Aktivitas</th>
                </tr>
              </thead>
              <tbody>
                {lessonPlan.items.map((item) => (
                  <tr key={item.developmentScope} className="border-b last:border-b-0">
                    <td className="p-3 align-top font-medium">
                      {getDevelopmentScopeLabel(item.developmentScope as Parameters<typeof getDevelopmentScopeLabel>[0])}
                    </td>
                    <td className="p-3 align-top text-muted-foreground">{item.learningGoal}</td>
                    <td className="p-3 align-top text-muted-foreground">{item.activityContext}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rangkaian Kegiatan */}
      {lessonPlan.activities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rangkaian Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {lessonPlan.activities.map((activity) => (
                <div key={activity.phase} className="px-6 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {ACTIVITY_PHASE_LABELS[activity.phase] ?? activity.phase}
                    </span>
                    {activity.durationMinutes != null && activity.durationMinutes > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {activity.durationMinutes} menit
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {activity.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onFinish}>
          <IconCheck className="mr-2 h-4 w-4" />
          Selesai
        </Button>
      </div>
    </div>
  )
}
