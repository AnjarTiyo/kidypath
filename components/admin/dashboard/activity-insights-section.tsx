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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import { IconActivityHeartbeat } from '@tabler/icons-react'

interface ActivityData {
  description: string
  count: number
  avgScoreOnDay: number | null
}

const freqConfig = {
  count: { label: 'Frekuensi', color: '#6366f1' },
} satisfies ChartConfig

const scoreConfig = {
  avgScoreOnDay: { label: 'Rata-rata Skor', color: '#10b981' },
} satisfies ChartConfig

function truncate(s: string, n = 22) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function ActivityInsightsSection() {
  const { filters } = useDashboardFilters()
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    startTransition(() => setLoading(true))
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    })
    fetch(`/api/admin/dashboard/activity-insights?${params}`)
      .then((r) => r.json())
      .then((d) => { setActivities(d.topActivities || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const freqData = activities.map((a) => ({
    name: truncate(a.description),
    full: a.description,
    count: a.count,
  }))

  const scoreData = activities
    .filter((a) => a.avgScoreOnDay !== null)
    .map((a) => ({
      name: truncate(a.description),
      full: a.description,
      avgScoreOnDay: a.avgScoreOnDay!,
    }))

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconActivityHeartbeat size={18} />
          Aktivitas & Dampak pada Penilaian
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Memuat data...
          </div>
        ) : activities.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Belum ada data aktivitas
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Frequency Chart */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Top Aktivitas (berdasarkan frekuensi)</p>
              <ChartContainer config={freqConfig} className="w-full" style={{ height: Math.max(160, freqData.length * 32) }}>
                <BarChart data={freqData} layout="vertical">
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-sm border bg-background px-3 py-2 shadow-md text-sm max-w-xs">
                          <p className="font-medium">{payload[0].payload.full}</p>
                          <p className="text-muted-foreground">Frekuensi: <strong>{payload[0].value}</strong></p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Frekuensi" />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Score Impact Chart */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Rata-rata Skor Penilaian di Hari Aktivitas Tersebut</p>
              {scoreData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada korelasi data
                </div>
              ) : (
                <ChartContainer config={scoreConfig} className="w-full" style={{ height: Math.max(160, scoreData.length * 32) }}>
                  <BarChart data={scoreData} layout="vertical">
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} ticks={[1, 2, 3, 4]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={130}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="rounded-sm border bg-background px-3 py-2 shadow-md text-sm max-w-xs">
                            <p className="font-medium">{payload[0].payload.full}</p>
                            <p className="text-muted-foreground">Rata-rata Skor: <strong>{Number(payload[0].value).toFixed(2)}</strong></p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="avgScoreOnDay" radius={[0, 4, 4, 0]} name="Rata-rata Skor">
                      {scoreData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.avgScoreOnDay >= 3.5 ? '#10b981'
                            : entry.avgScoreOnDay >= 2.5 ? '#6366f1'
                            : entry.avgScoreOnDay >= 1.5 ? '#f59e0b'
                            : '#ef4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { color: 'bg-emerald-400', label: 'BSB (≥3.5)' },
                  { color: 'bg-indigo-400', label: 'BSH (≥2.5)' },
                  { color: 'bg-amber-400', label: 'MB (≥1.5)' },
                  { color: 'bg-red-400', label: 'BB (<1.5)' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
