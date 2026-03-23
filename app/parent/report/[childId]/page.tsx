'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/layout/loading-state'
import { DateRangeSelector, DateRange } from '@/components/report/date-range-selector'
import { StudentReportCard } from '@/components/report/student-report-card'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { IconChartBar, IconHome, IconLoader2 } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface StudentData {
  student: {
    id: string
    fullName: string | null
    classroomId: string | null
    birthDate: string | null
    gender: string | null
  }
  attendanceStats: { present: number; sick: number; permission: number }
  moodDistribution: Record<string, number>
  scopeBreakdown: {
    scope: string
    scoreSummary: Record<string, number>
    objectives: {
      objectiveId: string | null
      objectiveDescription: string | null
      entries: { date: string | null; score: string | null; activityContext: string | null; note: string | null }[]
    }[]
  }[]
}

export default function ParentChildReportPage() {
  const router = useRouter()
  const params = useParams<{ childId: string }>()
  const { user, children, loading: userLoading } = useCurrentUser()
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login')
    if (!userLoading && user && user.role !== 'parent') router.push('/unauthorized')
  }, [user, userLoading, router])

  const handleRangeChange = async (range: DateRange) => {
    setDateRange(range)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/reports/student/${params.childId}?startDate=${range.startDate}&endDate=${range.endDate}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat laporan')
      setStudentData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) return <LoadingState message="Memuat data..." />
  if (!user) return null

  const child = children?.find((c) => c.id === params.childId)
  const childName = child?.fullName ?? studentData?.student?.fullName ?? 'Anak'

  return (
    <div className="space-y-6">
      <PageHeader
        title={childName}
        description="Laporan Perkembangan"
        breadcrumbs={[
          { label: 'Beranda', href: '/parent', icon: IconHome },
          { label: 'Laporan', href: '/parent/report', icon: IconChartBar },
          { label: childName },
        ]}
        actions={
          <Link href={`/parent/report/weekly/${params.childId}`}>
            <Button variant="outline" size="sm">
              Laporan Mingguan
            </Button>
          </Link>
        }
      />

      <DateRangeSelector onRangeChange={handleRangeChange} />

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <IconLoader2 className="animate-spin" size={20} />
          <span>Memuat data...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && studentData && dateRange && (
        <StudentReportCard
          student={studentData.student}
          attendanceStats={studentData.attendanceStats}
          moodDistribution={studentData.moodDistribution}
          scopeBreakdown={studentData.scopeBreakdown}
          dateRangeLabel={dateRange.label}
        />
      )}

      {!loading && !error && !studentData && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Pilih periode untuk melihat laporan perkembangan
          </CardContent>
        </Card>
      )}
    </div>
  )
}
