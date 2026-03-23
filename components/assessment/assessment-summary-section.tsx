"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { IconLoader2, IconSparkles } from "@tabler/icons-react"

interface AssessmentSummarySectionProps {
  summary: string
  onSummaryChange: (value: string) => void
  generateChecked: boolean
  onGenerateCheckedChange: (checked: boolean) => void
  loading: boolean
  generating: boolean
  onGenerate: () => void
}

export function AssessmentSummarySection({
  summary,
  onSummaryChange,
  generateChecked,
  onGenerateCheckedChange,
  loading,
  generating,
  onGenerate,
}: AssessmentSummarySectionProps) {
  return (
    <div className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="assessment-summary" className="text-[10px] sm:text-[11px] font-medium">
          Ringkasan Penilaian
        </Label>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="generateSummary"
              checked={generateChecked}
              onChange={(e) => onGenerateCheckedChange(e.target.checked)}
              disabled={loading || generating || summary.trim().length > 0}
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 cursor-pointer disabled:cursor-not-allowed"
            />
            <Label
              htmlFor="generateSummary"
              className="text-[9px] sm:text-[10px] text-muted-foreground cursor-pointer"
            >
              Generate AI
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={loading || generating}
            className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1.5 sm:px-2"
          >
            {generating
              ? <IconLoader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
              : <IconSparkles className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
            }
            Generate
          </Button>
        </div>
      </div>
      <Textarea
        id="assessment-summary"
        placeholder="Ringkasan penilaian akan dibuat otomatis jika Generate Summary dicentang saat menyimpan, atau klik tombol Generate untuk membuat sekarang. Anda juga bisa menulis manual..."
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        disabled={loading || generating}
        className="min-h-[60px] sm:min-h-[80px] text-[10px] sm:text-[11px] resize-none"
        rows={3}
      />
    </div>
  )
}
