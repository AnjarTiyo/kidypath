'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/layout/loading-state'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { WeeklyReportTable, type WeeklyReportRow } from '@/components/report/weekly-report-table'
import {
  IconChartBar,
  IconHome,
  IconLoader2,
  IconSparkles,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconChalkboardTeacher,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'

interface Student {
  id: string
  fullName: string | null
  classroomId: string | null
}

type GenerateStatus = 'pending' | 'processing' | 'done' | 'error'

interface GenerateProgress {
  studentId: string
  studentName: string | null
  status: GenerateStatus
  error?: string
}

export default function TeacherWeeklyReportClient() {
  const router = useRouter()
  const { user, classrooms, loading: userLoading } = useCurrentUser()

  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const weekStart = format(startOfWeek(weekAnchor, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(weekAnchor, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [reports, setReports] = useState<WeeklyReportRow[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [sending, setSending] = useState<Set<string>>(new Set())

  // Batch generate state
  const [showConfirm, setShowConfirm] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [progress, setProgress] = useState<GenerateProgress[]>([])
  const [generationDone, setGenerationDone] = useState(false)

  const classroomId = classrooms?.[0]?.id

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login')
    if (!userLoading && user && user.role !== 'teacher') router.push('/unauthorized')
  }, [user, userLoading, router])

  const fetchReports = useCallback(async () => {
    if (!classroomId) return
    setLoadingReports(true)
    try {
      const res = await fetch(`/api/reports/weekly?classroomId=${classroomId}`)
      const json = await res.json()
      const all: WeeklyReportRow[] = json.data ?? []
      // Filter by currently selected week
      setReports(all.filter((r) => r.weekStart === weekStart && r.weekEnd === weekEnd))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReports(false)
    }
  }, [classroomId, weekStart, weekEnd])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Fetch students when needed for generate
  const fetchStudents = useCallback(async (): Promise<Student[]> => {
    if (!classroomId) return []
    const res = await fetch(`/api/students?classroomId=${classroomId}`)
    const json = await res.json()
    const s: Student[] = json.data ?? []
    setStudents(s)
    return s
  }, [classroomId])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reports/weekly/${id}`, { method: 'DELETE' })
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async (id: string) => {
    setSending((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/reports/weekly/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentAt: new Date().toISOString() }),
      })
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, sentAt: new Date() } : r))
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const handleOpenConfirm = async () => {
    await fetchStudents()
    setShowConfirm(true)
  }

  const handleStartGenerate = async () => {
    setShowConfirm(false)
    setGenerationDone(false)

    const studentList = students.length > 0 ? students : await fetchStudents()
    if (studentList.length === 0) return

    setProgress(
      studentList.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        status: 'pending',
      }))
    )
    setShowProgress(true)

    for (const student of studentList) {
      // Update status → processing
      setProgress((prev) =>
        prev.map((p) => (p.studentId === student.id ? { ...p, status: 'processing' } : p))
      )

      try {
        // 1. Create report draft
        let reportId: string
        const createRes = await fetch('/api/reports/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id, weekStart, weekEnd }),
        })
        const createJson = await createRes.json()
        if (!createRes.ok) {
          if (createRes.status === 409 && createJson.existingId) {
            reportId = createJson.existingId
          } else {
            throw new Error(createJson.error ?? 'Failed to create report')
          }
        } else {
          reportId = createJson.data.id
        }

        // 2. Generate AI summary
        const genRes = await fetch('/api/reports/weekly/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id, weekStart, weekEnd }),
        })
        const genJson = await genRes.json()
        if (!genRes.ok) throw new Error(genJson.error ?? 'AI generation failed')

        // 3. Save summary + mark autoGenerated
        await fetch(`/api/reports/weekly/${reportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summaryText: genJson.summary, autoGenerated: true }),
        })

        setProgress((prev) =>
          prev.map((p) => (p.studentId === student.id ? { ...p, status: 'done' } : p))
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setProgress((prev) =>
          prev.map((p) => (p.studentId === student.id ? { ...p, status: 'error', error: msg } : p))
        )
      }
    }

    setGenerationDone(true)
  }

  const handleProgressClose = () => {
    setShowProgress(false)
    setProgress([])
    fetchReports()
  }

  if (userLoading) return <LoadingState message="Memuat data..." />
  if (!user) return null

  const doneCount = progress.filter((p) => p.status === 'done' || p.status === 'error').length
  const progressPct = progress.length > 0 ? Math.round((doneCount / progress.length) * 100) : 0

  const weekLabel = `${format(startOfWeek(weekAnchor, { weekStartsOn: 1 }), 'd MMM', { locale: idLocale })} – ${format(endOfWeek(weekAnchor, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: idLocale })}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Mingguan Siswa"
        description="Kelola laporan mingguan untuk dikirimkan ke orang tua"
        breadcrumbs={[
          { label: 'Beranda', href: '/teacher', icon: IconHome },
          { label: 'Laporan', href: '/teacher/report', icon: IconChartBar },
          { label: 'Laporan Mingguan' },
        ]}
        actions={
          <div className="flex flex-col items-center gap-2">
            <Button variant={"outline"} className='w-full' size={"sm"}>
              <IconChalkboardTeacher size={16} />
              {classrooms?.[0]?.name ?? 'Kelas'}
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleOpenConfirm}
              disabled={!classroomId}
            >
              <IconSparkles size={16} />
              Generate Laporan Kelas
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className='space-y-4'>
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekAnchor((d) => subWeeks(d, 1))}
            >
              <IconChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center tabular-nums">
              {weekLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}
            >
              <IconChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-1 text-xs"
              onClick={() => setWeekAnchor(new Date())}
            >
              Minggu ini
            </Button>
          </div>

          {/* Table */}
          {loadingReports ? (
            <LoadingState message="Memuat laporan..." />
          ) : (
            <WeeklyReportTable data={reports} onDelete={handleDelete} onSend={handleSend} sending={sending} />
          )}
        </CardContent>
      </Card>

      {/* Confirm generate dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate laporan untuk seluruh kelas?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Laporan akan dibuat otomatis dengan AI untuk{' '}
                  <strong>{students.length} siswa</strong> pada periode:
                </p>
                <p className="font-medium">{weekLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Proses ini memerlukan waktu beberapa menit. Laporan yang sudah ada tidak akan
                  ditimpa.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartGenerate} className="gap-2">
              <IconSparkles size={14} />
              Mulai Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress dialog */}
      <Dialog open={showProgress} onOpenChange={() => { }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Generating Laporan Mingguan…</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {doneCount} / {progress.length} selesai
                </span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {progress.map((p) => (
                <div
                  key={p.studentId}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="truncate">{p.studentName ?? 'Siswa'}</span>
                  <StatusBadge status={p.status} error={p.error} />
                </div>
              ))}
            </div>

            {generationDone && (
              <Button className="w-full" onClick={handleProgressClose}>
                Selesai — Lihat Hasil
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status, error }: { status: GenerateStatus; error?: string }) {
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Menunggu
      </Badge>
    )
  }
  if (status === 'processing') {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <IconLoader2 size={10} className="animate-spin" />
        Proses...
      </Badge>
    )
  }
  if (status === 'done') {
    return (
      <Badge className="gap-1 text-xs bg-green-600 hover:bg-green-600">
        <IconCheck size={10} />
        Selesai
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1 text-xs" title={error}>
      <IconX size={10} />
      Error
    </Badge>
  )
}
