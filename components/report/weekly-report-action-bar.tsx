'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  IconArrowLeft,
  IconPrinter,
  IconFileTypePdf,
  IconPencil,
  IconCheck,
  IconLoader2,
  IconSparkles,
  IconEye,
  IconEyeOff,
  IconBrandWhatsapp,
  IconDownload,
} from '@tabler/icons-react'
import type { DetailPayload } from '@/lib/types/weekly-report-detail'

interface WeeklyReportActionBarProps {
  payload: DetailPayload
  isEditing: boolean
  saving: boolean
  saved: boolean
  generating: boolean
  publishing: boolean
  exporting: boolean
  uploadingPdf: boolean
  sendingWhatsApp: boolean
  onEdit: () => void
  onSave: () => void
  onGenerateAI: () => void
  onExportPDF: () => void
  onPublishClick: () => void
  onSendWhatsApp: () => void
}

export function WeeklyReportActionBar({
  payload,
  isEditing,
  saving,
  saved,
  generating,
  publishing,
  exporting,
  uploadingPdf,
  sendingWhatsApp,
  onEdit,
  onSave,
  onGenerateAI,
  onExportPDF,
  onPublishClick,
  onSendWhatsApp,
}: WeeklyReportActionBarProps) {
  const router = useRouter()
  const { report } = payload
  const isPublished = report.isPublished ?? false

  return (
    <div className="flex items-center gap-2 flex-wrap mt-4">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
        <IconArrowLeft size={15} />
        Kembali
      </Button>

      <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
        <IconPrinter size={15} />
        Print
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExportPDF}
        disabled={exporting}
        className="gap-1.5"
      >
        {exporting ? (
          <IconLoader2 size={15} className="animate-spin" />
        ) : (
          <IconFileTypePdf size={15} />
        )}
        Export PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onGenerateAI}
        disabled={generating}
        className="gap-1.5"
      >
        {generating ? (
          <IconLoader2 size={15} className="animate-spin" />
        ) : (
          <IconSparkles size={15} />
        )}
        Regenerate AI
      </Button>

      {isEditing ? (
        <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5">
          {saving ? (
            <IconLoader2 size={15} className="animate-spin" />
          ) : saved ? (
            <IconCheck size={15} />
          ) : (
            <IconPencil size={15} />
          )}
          Simpan
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
          <IconPencil size={15} />
          Edit Ringkasan
        </Button>
      )}

      <Button
        variant={isPublished ? 'default' : 'outline'}
        size="sm"
        onClick={onPublishClick}
        disabled={publishing}
        className="gap-1.5"
      >
        {publishing ? (
          <IconLoader2 size={15} className="animate-spin" />
        ) : isPublished ? (
          <IconEye size={15} />
        ) : (
          <IconEyeOff size={15} />
        )}
        {isPublished ? 'Terbit' : 'Draf'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onSendWhatsApp}
        disabled={sendingWhatsApp}
        className="gap-1.5"
      >
        {sendingWhatsApp ? (
          <IconLoader2 size={15} className="animate-spin" />
        ) : (
          <IconBrandWhatsapp size={15} />
        )}
        Kirim WhatsApp
      </Button>

      {report.pdfUrl && (
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
            {uploadingPdf ? (
              <IconLoader2 size={15} className="animate-spin" />
            ) : (
              <IconDownload size={15} />
            )}
            Unduh PDF
          </a>
        </Button>
      )}

      {uploadingPdf && !report.pdfUrl && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconLoader2 size={13} className="animate-spin" />
          Membuat PDF...
        </span>
      )}
    </div>
  )
}
