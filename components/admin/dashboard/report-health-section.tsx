'use client'

import { startTransition, useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { IconFileReport } from '@tabler/icons-react'

interface WeeklyPoint { week: string; completionPct: number; published: number; total: number }
interface MissingReport { type: string; studentId: string; studentName: string; period: string }

const chartConfig = {
  weeklyPct: { label: 'Laporan Mingguan (%)', color: '#6366f1' },
} satisfies ChartConfig

export function ReportHealthSection() {
  const { filters } = useDashboardFilters()
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyPoint[]>([])
  const [missingReports, setMissingReports] = useState<MissingReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    startTransition(() => setLoading(true))
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
    fetch(`/api/admin/dashboard/report-health?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setWeeklyTrend(d.weeklyTrend || [])
        setMissingReports(d.missingReports || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters.startDate, filters.endDate])

  const chartData = weeklyTrend.map((w) => ({
    week: w.week ? w.week.slice(5) : '',
    weeklyPct: w.completionPct,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Area Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconFileReport size={18} />
            Tren Penyelesaian Laporan Mingguan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading || chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              {loading ? 'Memuat data...' : 'Belum ada data laporan'}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} width={30} />
                <ChartTooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-sm border bg-background px-3 py-2 shadow-md text-sm">
                        <p>Pekan: {payload[0].payload.week}</p>
                        <p className="font-medium">Selesai: {payload[0].value}%</p>
                      </div>
                    ) : null
                  }
                />
                <defs>
                  <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="weeklyPct"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#weeklyGrad)"
                  name="Mingguan (%)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Missing Reports Alert */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Laporan Belum Dibuat</span>
            {!loading && (
              <Badge className={missingReports.length === 0 ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                {missingReports.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 p-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat...</div>
          ) : missingReports.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              ✅ Semua laporan sudah selesai
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {missingReports.map((r) => (
                <div
                  key={r.studentId}
                  className="flex items-start gap-2 px-4 py-2.5 border-b last:border-0 hover:bg-muted/30"
                >
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.period}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 shrink-0">
                    {r.type === 'weekly' ? 'Mingguan' : 'Bulanan'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
