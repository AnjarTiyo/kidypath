'use client'

import { useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { KpiCard } from './kpi-card'
import { Users, School, CalendarCheck, FileText, Smile } from 'lucide-react'

interface SummaryData {
  totalStudents: number
  totalClassrooms: number
  weeklyAttendanceRate: number
  reportCompletionPct: number
  dominantMood: string
  aiInsight: string
}

const MOOD_EMOJI: Record<string, string> = {
  bahagia: '😊 Bahagia',
  sedih: '😢 Sedih',
  marah: '😠 Marah',
  takut: '😨 Takut',
  jijik: '😖 Jijik',
}

export function ExecutiveOverview() {
  const { filters } = useDashboardFilters()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/dashboard/summary?startDate=${filters.startDate}&endDate=${filters.endDate}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters.startDate, filters.endDate])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total Siswa"
          value={loading ? '—' : (data?.totalStudents ?? 0)}
          icon={Users}
          colorVariant="blue"
        />
        <KpiCard
          label="Kelas Aktif"
          value={loading ? '—' : (data?.totalClassrooms ?? 0)}
          icon={School}
          colorVariant="default"
        />
        <KpiCard
          label="Kehadiran Minggu Ini"
          value={loading ? '—' : Number(data?.weeklyAttendanceRate ?? 0).toFixed(2)}
          suffix="%"
          icon={CalendarCheck}
          colorVariant={
            !data ? 'default'
            : data.weeklyAttendanceRate >= 80 ? 'green'
            : 'red'
          }
        />
        <KpiCard
          label="Laporan Selesai"
          value={loading ? '—' : Number(data?.reportCompletionPct ?? 0).toFixed(2)}
          suffix="%"
          icon={FileText}
          colorVariant={
            !data ? 'default'
            : data.reportCompletionPct >= 80 ? 'green'
            : data.reportCompletionPct >= 50 ? 'yellow'
            : 'red'
          }
        />
        <KpiCard
          label="Mood Dominan"
          value={loading ? '—' : (MOOD_EMOJI[data?.dominantMood || ''] || data?.dominantMood || '—')}
          icon={Smile}
          colorVariant={
            !data ? 'default'
            : data.dominantMood === 'bahagia' ? 'green'
            : data.dominantMood === 'sedih' || data.dominantMood === 'marah' ? 'red'
            : 'yellow'
          }
        />
      </div>
    </div>
  )
}
