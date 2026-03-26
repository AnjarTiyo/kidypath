"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconSparkles, IconUpload } from "@tabler/icons-react"

type ActivityPhase =
  | "kegiatan_awal"
  | "kegiatan_inti"
  | "istirahat"
  | "kegiatan_penutup"
  | "refleksi"

interface ActivityPhaseItem {
  phase: ActivityPhase
  description: string
  generatedByAi?: boolean
}

interface LessonPlanActivitiesCardProps {
  activities: ActivityPhaseItem[]
  materials: string
  isGenerating?: boolean
  onActivityChange: (phase: ActivityPhase, value: string) => void
  onMaterialsChange: (value: string) => void
}

const PHASE_CONFIG: Record<ActivityPhase, { label: string; duration: string; placeholder: string }> = {
  kegiatan_awal: {
    label: "Kegiatan Awal",
    duration: "± 15 menit",
    placeholder: "Contoh: Berdoa bersama, salam, mengabsen, ice breaking, menyanyikan lagu pembuka, bercerita singkat tentang tema...",
  },
  kegiatan_inti: {
    label: "Kegiatan Inti",
    duration: "± 60 menit",
    placeholder: "Contoh: Eksplorasi bahan, bermain peran, kegiatan seni, permainan edukatif sesuai aspek perkembangan...",
  },
  istirahat: {
    label: "Istirahat",
    duration: "± 30 menit",
    placeholder: "Contoh: Cuci tangan, makan bekal, bermain bebas di luar/dalam kelas, toilet time...",
  },
  kegiatan_penutup: {
    label: "Kegiatan Penutup",
    duration: "± 15 menit",
    placeholder: "Contoh: Recalling kegiatan hari ini, tanya jawab, pesan moral, doa penutup, persiapan pulang...",
  },
  refleksi: {
    label: "Refleksi Guru",
    duration: "Catatan",
    placeholder: "Contoh: Catatan perkembangan anak hari ini, hal yang perlu ditingkatkan, rencana tindak lanjut...",
  },
}

const PHASES: ActivityPhase[] = [
  "kegiatan_awal",
  "kegiatan_inti",
  "istirahat",
  "kegiatan_penutup",
  "refleksi",
]

export function LessonPlanActivitiesCard({
  activities,
  materials,
  isGenerating = false,
  onActivityChange,
  onMaterialsChange,
}: LessonPlanActivitiesCardProps) {
  const getActivity = (phase: ActivityPhase) =>
    activities.find((a) => a.phase === phase) ?? { phase, description: "", generatedByAi: false }

  const hasAiActivities = activities.some((a) => a.generatedByAi && a.description)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md">Rangkaian Kegiatan &amp; Alat Bahan</CardTitle>
            <CardDescription className="text-xs">
              Isi deskripsi setiap fase kegiatan harian dan alat atau bahan yang dibutuhkan
            </CardDescription>
          </div>
          {hasAiActivities && (
            <Badge variant="secondary" className="text-xs shrink-0">
              <IconSparkles className="mr-1 h-3 w-3" />
              AI Generated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {/* Activity Phases */}
        <div className="border-t">
          <div className="px-6 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Rangkaian Kegiatan
            </p>
          </div>
          <div className="divide-y">
            {PHASES.map((phase) => {
              const activity = getActivity(phase)
              const config = PHASE_CONFIG[phase]
              return (
                <div key={phase} className="px-6 py-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`activity-${phase}`} className="text-xs font-semibold">
                      {config.label}
                    </Label>
                    <span className="text-[10px] text-muted-foreground">{config.duration}</span>
                    {activity.generatedByAi && activity.description && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                        <IconSparkles className="mr-0.5 h-2.5 w-2.5" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    id={`activity-${phase}`}
                    placeholder={config.placeholder}
                    value={activity.description}
                    onChange={(e) => onActivityChange(phase, e.target.value)}
                    disabled={isGenerating}
                    rows={3}
                    className="resize-none text-xs"
                  />
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Alat dan Bahan */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Alat dan Bahan
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="text-xs h-7 opacity-50 cursor-not-allowed"
            >
              <IconUpload className="mr-1.5 h-3 w-3" />
              Upload Materi Pembelajaran
            </Button>
          </div>
          <Textarea
            id="materials"
            placeholder="Contoh: Kertas HVS, krayon, lem stick, gunting anak, kartu gambar hewan, video pembelajaran tentang hewan, buku cerita bergambar..."
            value={materials}
            onChange={(e) => onMaterialsChange(e.target.value)}
            disabled={isGenerating}
            rows={4}
            className="resize-none text-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
