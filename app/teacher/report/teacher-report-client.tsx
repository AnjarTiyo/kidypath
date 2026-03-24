'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/layout/loading-state'
import { DateRangeSelector, DateRange } from '@/components/report/date-range-selector'
import { ClassReportSummary } from '@/components/report/class-report-summary'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { IconChartBar, IconHome } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconLoader2 } from '@tabler/icons-react'
import Link from 'next/link'

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

export default function TeacherReportClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, classrooms, loading: userLoading } = useCurrentUser()
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login')
    if (!userLoading && user && user.role !== 'teacher') router.push('/unauthorized')
  }, [user, userLoading, router])

  const classroomId = classrooms?.[0]?.id

  const loadReport = useCallback(async (cId: string, range: DateRange) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/reports/class?classroomId=${cId}&startDate=${range.startDate}&endDate=${range.endDate}`
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

  // Restore filter from URL on mount
  useEffect(() => {
    const start = searchParams.get('startDate')
    const end = searchParams.get('endDate')
    const label = searchParams.get('label')
    if (start && end && classroomId) {
      const range: DateRange = { startDate: start, endDate: end, label: label ?? `${start} – ${end}` }
      setDateRange(range)
      loadReport(classroomId, range)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId])

  const handleRangeChange = async (range: DateRange) => {
    setDateRange(range)
    if (!classroomId) return
    router.replace(
      `${pathname}?${new URLSearchParams({ startDate: range.startDate, endDate: range.endDate, label: range.label }).toString()}`,
      { scroll: false }
    )
    await loadReport(classroomId, range)
  }

  if (userLoading) return <LoadingState message="Memuat data..." />
  if (!user) return null

  const classroomName = classrooms?.[0]?.name ?? 'Kelas'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kelas"
        description={classroomName}
        breadcrumbs={[
          { label: 'Beranda', href: '/teacher', icon: IconHome },
          { label: 'Laporan', icon: IconChartBar },
        ]}
        actions={
          <Link href="/teacher/report/weekly">
            <Button variant="outline" size="sm">
              Laporan Mingguan ke Orang Tua
            </Button>
          </Link>
        }
      />

      {!classroomId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Anda belum terdaftar di kelas manapun. Hubungi admin.
          </CardContent>
        </Card>
      )}

      {classroomId && (
        <>
          <DateRangeSelector onRangeChange={handleRangeChange} />

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

          {!loading && !error && reportData && dateRange && (
            <ClassReportSummary
              attendanceSummary={reportData.attendanceSummary}
              scopeScores={reportData.scopeScores}
              moodTimeSeries={reportData.moodTimeSeries}
              dateRangeLabel={dateRange.label}
              studentReportBasePath="/teacher/report/student"
              assessmentSummaries={reportData.assessmentSummaries}
            />
          )}

          {!loading && !error && !reportData && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Pilih periode untuk melihat laporan kelas
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
