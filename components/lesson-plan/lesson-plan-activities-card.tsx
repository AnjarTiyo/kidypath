"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { IconSparkles, IconUpload, IconLoader2 } from "@tabler/icons-react"

export type ActivityPhase =
  | "kegiatan_awal"
  | "kegiatan_inti"
  | "istirahat"
  | "kegiatan_penutup"
  | "refleksi"

export const DEFAULT_ACTIVITY_DURATIONS: Record<ActivityPhase, number> = {
  kegiatan_awal: 15,
  kegiatan_inti: 60,
  istirahat: 30,
  kegiatan_penutup: 15,
  refleksi: 0,
}

export interface ActivityPhaseItem {
  phase: ActivityPhase
  description: string
  durationMinutes: number
  generatedByAi?: boolean
}

interface LessonPlanActivitiesCardProps {
  activities: ActivityPhaseItem[]
  materials: string
  isGenerating?: boolean
  onActivityChange: (phase: ActivityPhase, value: string) => void
  onDurationChange?: (phase: ActivityPhase, durationMinutes: number) => void
  onMaterialsChange: (value: string) => void
  onGenerateWithAI?: (prompt?: string) => void
}

const PHASE_CONFIG: Record<ActivityPhase, { label: string; hideDuration?: boolean; placeholder: string }> = {
  kegiatan_awal: {
    label: "Kegiatan Awal",
    placeholder: "Contoh: Berdoa bersama, salam, mengabsen, ice breaking, menyanyikan lagu pembuka, bercerita singkat tentang tema...",
  },
  kegiatan_inti: {
    label: "Kegiatan Inti",
    placeholder: "Contoh: Eksplorasi bahan, bermain peran, kegiatan seni, permainan edukatif sesuai aspek perkembangan...",
  },
  istirahat: {
    label: "Istirahat",
    placeholder: "Contoh: Cuci tangan, makan bekal, bermain bebas di luar/dalam kelas, toilet time...",
  },
  kegiatan_penutup: {
    label: "Kegiatan Penutup",
    placeholder: "Contoh: Recalling kegiatan hari ini, tanya jawab, pesan moral, doa penutup, persiapan pulang...",
  },
  refleksi: {
    label: "Refleksi Guru",
    hideDuration: true,
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
  onDurationChange,
  onMaterialsChange,
  onGenerateWithAI,
}: LessonPlanActivitiesCardProps) {
  const [aiPromptOpen, setAiPromptOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  const getActivity = (phase: ActivityPhase): ActivityPhaseItem =>
    activities.find((a) => a.phase === phase) ?? {
      phase,
      description: "",
      durationMinutes: DEFAULT_ACTIVITY_DURATIONS[phase],
      generatedByAi: false,
    }

  const hasAiActivities = activities.some((a) => a.generatedByAi && a.description)

  const handleGenerateClick = () => {
    onGenerateWithAI?.(aiPrompt.trim())
    setAiPromptOpen(false)
    setAiPrompt("")
  }

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
          <div className="flex items-center gap-2">
            {hasAiActivities && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <IconSparkles className="mr-1 h-3 w-3" />
                AI Generated
              </Badge>
            )}
            {onGenerateWithAI && (
              <Popover open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="default" size="sm" disabled={isGenerating}>
                    {isGenerating ? (
                      <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <IconSparkles className="mr-1 h-3 w-3" />
                    )}
                    AI
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm flex items-center">
                        <IconSparkles className="mr-1 h-4 w-4" />
                        Instruksi untuk AI
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Berikan instruksi tambahan untuk menghasilkan rangkaian kegiatan yang lebih
                        sesuai (opsional)
                      </p>
                    </div>
                    <textarea
                      placeholder="Contoh: Tambahkan kegiatan outdoor, fokus pada kegiatan sensorik..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      className="w-full resize-none text-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setAiPromptOpen(false); setAiPrompt("") }}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        size="sm"
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <><IconLoader2 className="mr-1 h-3 w-3 animate-spin" />Generating...</>
                        ) : (
                          <><IconSparkles className="mr-1 h-3 w-3" />Generate</>
                        )}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor={`activity-${phase}`} className="text-xs font-semibold">
                      {config.label}
                    </Label>
                    {!config.hideDuration ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={300}
                          value={activity.durationMinutes}
                          onChange={(e) =>
                            onDurationChange?.(phase, parseInt(e.target.value) || 0)
                          }
                          disabled={isGenerating}
                          className="w-16 h-6 text-xs px-1.5 py-0"
                        />
                        <span className="text-[10px] text-muted-foreground">menit</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Catatan</span>
                    )}
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
