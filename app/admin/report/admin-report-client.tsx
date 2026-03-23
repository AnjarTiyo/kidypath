'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/layout/loading-state'
import { DateRangeSelector, DateRange } from '@/components/report/date-range-selector'
import { ClassReportSummary } from '@/components/report/class-report-summary'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { IconChartBar, IconHome, IconLoader2 } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Classroom {
  id: string
  name: string
  academicYear: string | null
}

interface ReportData {
  attendanceSummary: {
    studentId: string
    studentName: string | null
    present: number
    sick: number
    permission: number
  }[]
  scopeScores: Record<string, { BB: number; MB: number; BSH: number; BSB: number; total: number }>
  moodTimeSeries: { date: string; checkIn: string | null; checkOut: string | null }[]
  assessmentSummaries: {
    studentId: string | null
    studentName: string | null
    date: string | null
    summary: string
    items: {
      scopeName: string | null
      activityContext: string | null
      score: string | null
      note: string | null
    }[]
  }[]
}

export default function AdminReportClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useCurrentUser()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login')
    if (!userLoading && user && user.role !== 'admin') router.push('/unauthorized')
  }, [user, userLoading, router])

  useEffect(() => {
    fetch('/api/classrooms?pageSize=100')
      .then((r) => r.json())
      .then((data) => {
        const list: Classroom[] = data.data ?? []
        setClassrooms(list)
        // Restore classroomId from URL
        const urlClassroomId = searchParams.get('classroomId')
        if (urlClassroomId && list.some((c) => c.id === urlClassroomId)) {
          setSelectedClassroomId(urlClassroomId)
        }
      })
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchReport = useCallback(async (classroomId: string, range: DateRange) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/reports/class?classroomId=${classroomId}&startDate=${range.startDate}&endDate=${range.endDate}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat laporan')
      setReportData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [])

  // Restore date range from URL once classroomId is set
  useEffect(() => {
    const start = searchParams.get('startDate')
    const end = searchParams.get('endDate')
    const label = searchParams.get('label')
    if (start && end && selectedClassroomId) {
      const range: DateRange = { startDate: start, endDate: end, label: label ?? `${start} – ${end}` }
      setDateRange(range)
      fetchReport(selectedClassroomId, range)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassroomId])

  const pushParams = (cId: string, range: DateRange) => {
    router.replace(
      `${pathname}?${new URLSearchParams({ classroomId: cId, startDate: range.startDate, endDate: range.endDate, label: range.label }).toString()}`,
      { scroll: false }
    )
  }

  const handleClassroomChange = (id: string) => {
    setSelectedClassroomId(id)
    setReportData(null)
    if (dateRange) {
      pushParams(id, dateRange)
      fetchReport(id, dateRange)
    }
  }

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range)
    setReportData(null)
    if (selectedClassroomId) {
      pushParams(selectedClassroomId, range)
      fetchReport(selectedClassroomId, range)
    }
  }

  if (userLoading) return <LoadingState message="Memuat data..." />
  if (!user) return null

  const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kelas"
        description="Lihat laporan kehadiran dan perkembangan per kelas"
        breadcrumbs={[
          { label: 'Beranda', href: '/admin', icon: IconHome },
          { label: 'Laporan', icon: IconChartBar },
        ]}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Rombongan Belajar</Label>
          <Select value={selectedClassroomId} onValueChange={handleClassroomChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Pilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClassroomId && (
          <DateRangeSelector onRangeChange={handleRangeChange} />
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <IconLoader2 className="animate-spin" size={20} />
          <span>Memuat data laporan...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && reportData && dateRange && selectedClassroom && (
        <ClassReportSummary
          attendanceSummary={reportData.attendanceSummary}
          scopeScores={reportData.scopeScores}
          moodTimeSeries={reportData.moodTimeSeries}
          dateRangeLabel={`${selectedClassroom.name} — ${dateRange.label}`}
          studentReportBasePath="/admin/report/student"
          assessmentSummaries={reportData.assessmentSummaries}
        />
      )}

      {!loading && !error && !reportData && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {!selectedClassroomId
              ? 'Pilih rombongan belajar untuk mulai'
              : 'Pilih periode untuk melihat laporan'}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
