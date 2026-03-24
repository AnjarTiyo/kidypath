'use client'

import { useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { IconMoodHappy, IconCalendarCheck } from '@tabler/icons-react'

interface TrendPoint {
  date: string
  present: number
  sick: number
  permission: number
}

interface MoodPoint {
  mood: string
  label: string
  count: number
  [key: string]: string | number
}

const trendChartConfig = {
  present: { label: 'Hadir', color: '#10b981' },
  sick: { label: 'Sakit', color: '#f59e0b' },
  permission: { label: 'Izin', color: '#6366f1' },
} satisfies ChartConfig

const MOOD_COLORS: Record<string, string> = {
  bahagia: '#10b981',
  sedih: '#6366f1',
  marah: '#ef4444',
  takut: '#8b5cf6',
  jijik: '#f97316',
  unknown: '#9ca3af',
}

export function AttendanceMoodSection() {
  const { filters } = useDashboardFilters()
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [moodDist, setMoodDist] = useState<MoodPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    })
    fetch(`/api/admin/dashboard/attendance-trend?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setTrend(d.trend || [])
        setMoodDist(d.moodDist || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters])

  const formattedTrend = trend.map((t) => ({
    ...t,
    dateLabel: (() => {
      try { return format(parseISO(t.date!), 'd MMM', { locale: idLocale }) }
      catch { return t.date }
    })(),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Attendance Trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconCalendarCheck size={18} />
            Tren Kehadiran Harian
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading || formattedTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
              {loading ? 'Memuat data...' : 'Belum ada data kehadiran'}
            </div>
          ) : (
            <ChartContainer config={trendChartConfig} className="h-52 w-full">
              <LineChart data={formattedTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <ChartTooltip content={(props: any) => <ChartTooltipContent {...props} />} />
                <Line dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} name="Hadir" />
                <Line dataKey="sick" stroke="#f59e0b" strokeWidth={2} dot={false} name="Sakit" />
                <Line dataKey="permission" stroke="#6366f1" strokeWidth={2} dot={false} name="Izin" />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Mood Donut */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconMoodHappy size={18} />
            Distribusi Mood
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading || moodDist.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
              {loading ? 'Memuat data...' : 'Belum ada data mood'}
            </div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodDist}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {moodDist.map((entry) => (
                      <Cell
                        key={entry.mood}
                        fill={MOOD_COLORS[entry.mood] || '#9ca3af'}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span className="text-xs">{value}</span>}
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
