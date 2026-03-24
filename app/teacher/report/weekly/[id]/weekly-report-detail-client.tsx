'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/layout/loading-state'
import { ScoreRadarChart } from '@/components/report/score-radar-chart'
import { MoodLineChart } from '@/components/report/mood-line-chart'
import { WeeklyAssessmentDetail } from '@/components/report/weekly-assessment-detail'
import { ActivityGallery } from '@/components/report/activity-gallery'
import { WeeklyReportTopics } from '@/components/report/weekly-report-topics'
import { WeeklyReportAttendance } from '@/components/report/weekly-report-attendance'
import { WeeklyReportSummary } from '@/components/report/weekly-report-summary'
import { WeeklyReportActionBar } from '@/components/report/weekly-report-action-bar'
import { WeeklyReportPdfDocument } from '@/components/report/weekly-report-pdf'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { IconChartBar, IconHome, IconArrowLeft } from '@tabler/icons-react'
import { useWeeklyReportDetail } from '@/lib/hooks/use-weekly-report-detail'

export default function WeeklyReportDetailClient() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const reportId = params.id

  const {
    payload,
    loading,
    error,
    summaryText,
    setSummaryText,
    isEditing,
    setIsEditing,
    saving,
    saved,
    generating,
    publishing,
    showPublishConfirm,
    setShowPublishConfirm,
    handleSave,
    handleGenerateAI,
    handlePublishToggle,
  } = useWeeklyReportDetail(reportId)

  const [exporting, setExporting] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [waResult, setWaResult] = useState<{ title: string; message: string } | null>(null)

  const buildPdfBlob = useCallback(async (): Promise<Blob | null> => {
    if (!payload) return null

    // Fetch per-teacher signed verification token URLs from server
    let teacherQrCodes: Record<string, string> = {}
    try {
      const res = await fetch(`/api/reports/weekly/${reportId}/signature-tokens`)
      if (res.ok) {
        const { data } = await res.json()
        if (data && typeof data === 'object') {
          // Generate a QR code image for each teacher's signed URL
          const entries = await Promise.all(
            Object.entries(data as Record<string, string>).map(async ([teacherId, url]) => {
              const qr = await QRCode.toDataURL(url, {
                width: 120,
                margin: 1,
                errorCorrectionLevel: 'M',
              })
              return [teacherId, qr] as [string, string]
            })
          )
          teacherQrCodes = Object.fromEntries(entries)
        }
      }
    } catch {
      // QR codes are optional — continue without them
    }

    const blob = await pdf(
      <WeeklyReportPdfDocument payload={payload} teacherQrCodes={teacherQrCodes} />
    ).toBlob()
    return blob
  }, [payload, reportId])

  const handleExportPDF = async () => {
    if (!payload) return
    setExporting(true)
    try {
      const blob = await buildPdfBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const studentName = payload.student?.fullName?.replace(/\s+/g, '_') ?? 'siswa'
      a.href = url
      a.download = `laporan_mingguan_${studentName}_${payload.report.weekStart}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!payload?.report.studentId) return
    setSendingWhatsApp(true)
    try {
      const reportLink = `${window.location.origin}/parent/report/weekly/${payload.report.studentId}`
      const res = await fetch(`/api/reports/weekly/${reportId}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportLink }),
      })
      const data = await res.json()
      if (!res.ok) {
        setWaResult({ title: 'Gagal mengirim', message: data.error ?? 'Terjadi kesalahan saat mengirim pesan.' })
      } else {
        setWaResult({
          title: 'Pesan terkirim',
          message: `Berhasil mengirim ke ${data.sent} dari ${data.total} nomor orang tua.${
            data.failed?.length ? `\n\nGagal: ${data.failed.join(', ')}` : ''
          }`,
        })
      }
    } catch {
      setWaResult({ title: 'Gagal mengirim', message: 'Terjadi kesalahan jaringan.' })
    } finally {
      setSendingWhatsApp(false)
    }
  }

  const handlePublish = () => {
    handlePublishToggle(async () => {
      setUploadingPdf(true)
      try {
        const blob = await buildPdfBlob()
        if (blob) {
          const form = new FormData()
          form.append('file', blob, `laporan_mingguan_${reportId}.pdf`)
          await fetch(`/api/reports/weekly/${reportId}/pdf`, { method: 'POST', body: form })
        }
      } catch (e) {
        console.error('PDF upload failed:', e)
      } finally {
        setUploadingPdf(false)
      }
    })
  }

  if (loading) return <LoadingState message="Memuat laporan..." />
  if (error) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <IconArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>
      </div>
    )
  }
  if (!payload) return null

  const { report, student, topics, attendanceByDate, scopeScores, moodTimeSeries, scopeBreakdown, activityImages } = payload
  const isPublished = report.isPublished ?? false

  return (
    <div className="space-y-6">
      {/* Breadcrumb + action bar (hidden on print) */}
      <div className="print:hidden print-hidden">
        <PageHeader
          title={`Laporan Mingguan — ${student?.fullName ?? '—'}`}
          description={`${report.weekStart} – ${report.weekEnd}`}
          breadcrumbs={[
            { label: 'Beranda', href: '/teacher', icon: IconHome },
            { label: 'Laporan', href: '/teacher/report', icon: IconChartBar },
            { label: 'Laporan Mingguan', href: '/teacher/report/weekly' },
            { label: student?.fullName ?? '—' },
          ]}
        />
        <WeeklyReportActionBar
          payload={payload}
          isEditing={isEditing}
          saving={saving}
          saved={saved}
          generating={generating}
          publishing={publishing}
          exporting={exporting}
          uploadingPdf={uploadingPdf}
          sendingWhatsApp={sendingWhatsApp}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onGenerateAI={handleGenerateAI}
          onExportPDF={handleExportPDF}
          onPublishClick={() => setShowPublishConfirm(true)}
          onSendWhatsApp={handleSendWhatsApp}
        />
      </div>

      {/* ── Printable content ───────────────────────────────────────────── */}
      <div id="weekly-report-print" className="space-y-6">
        {/* Print-only header */}
        <div className="hidden print:block text-center py-4 border-b-2">
          <p className="text-sm text-muted-foreground">Laporan Perkembangan Mingguan</p>
          <h1 className="text-xl font-bold mt-1">{student?.fullName ?? '—'}</h1>
          <p className="text-sm mt-0.5">{report.weekStart} – {report.weekEnd}</p>
        </div>

        <WeeklyReportTopics topics={topics} />

        <WeeklyReportAttendance attendanceByDate={attendanceByDate} />

        <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-1">
          <ScoreRadarChart scopeScores={scopeScores} />
          <MoodLineChart moodTimeSeries={moodTimeSeries} />
        </div>

        <WeeklyAssessmentDetail scopeBreakdown={scopeBreakdown} />

        <ActivityGallery images={activityImages} />

        <WeeklyReportSummary
          report={report}
          isEditing={isEditing}
          summaryText={summaryText}
          saving={saving}
          onSummaryChange={setSummaryText}
          onSave={handleSave}
          onCancelEdit={() => {
            setIsEditing(false)
            setSummaryText(report.summaryText ?? '')
          }}
        />

        {/* Print footer */}
        <div className="hidden print:block text-center text-xs text-muted-foreground border-t pt-4 mt-4">
          Dicetak dari sistem jurnal harian TK · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Publish confirm dialog */}
      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPublished ? 'Tarik dari publikasi?' : 'Publikasikan laporan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPublished
                ? 'Laporan tidak akan terlihat lagi oleh orang tua.'
                : 'Laporan akan terlihat oleh orang tua siswa.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              {isPublished ? 'Tarik' : 'Terbitkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* WhatsApp result dialog */}
      <AlertDialog open={!!waResult} onOpenChange={(open) => { if (!open) setWaResult(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{waResult?.title}</AlertDialogTitle>
            <AlertDialogDescription style={{ whiteSpace: 'pre-line' }}>
              {waResult?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setWaResult(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
