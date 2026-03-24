'use client'

import { startTransition, useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { IconBrain } from '@tabler/icons-react'

interface ScopeData {
  scope: string
  label: string
  avgScore: number
}

const radarConfig = {
  skor: { label: 'Rata-rata Skor', color: 'var(--chart-1)' },
} satisfies ChartConfig

const barConfig = {
  avgScore: { label: 'Rata-rata Skor', color: 'var(--chart-2)' },
} satisfies ChartConfig

function getScoreColor(score: number): string {
  if (score >= 3.5) return '#10b981'    // BSB - hijau
  if (score >= 2.5) return '#6366f1'   // BSH - ungu
  if (score >= 1.5) return '#f59e0b'   // MB - kuning
  return '#ef4444'                       // BB - merah
}

export function DevelopmentProgressSection() {
  const { filters } = useDashboardFilters()
  const [scopes, setScopes] = useState<ScopeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    startTransition(() => setLoading(true))
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    })
    fetch(`/api/admin/dashboard/development-progress?${params}`)
      .then((r) => r.json())
      .then((d) => { setScopes(d.scopes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  const radarData = scopes.map((s) => ({ scope: s.label, skor: s.avgScore }))
  const barData = [...scopes].sort((a, b) => a.avgScore - b.avgScore)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Radar */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBrain size={18} />
            Profil Perkembangan Sekolah (Radar)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {loading || radarData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              {loading ? 'Memuat data...' : 'Belum ada data penilaian'}
            </div>
          ) : (
            <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[280px]">
              <RadarChart data={radarData}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <ChartTooltip cursor={false} content={(props: any) => <ChartTooltipContent {...props} />} />
                <PolarAngleAxis dataKey="scope" tick={{ fontSize: 11 }} />
                <PolarGrid />
                <Radar dataKey="skor" fill="var(--color-skor)" fillOpacity={0.6} stroke="var(--color-skor)" />
              </RadarChart>
            </ChartContainer>
          )}
          <p className="text-xs text-center text-muted-foreground mt-1">
            Skala 1–4: BB=1, MB=2, BSH=3, BSB=4
          </p>
        </CardContent>
      </Card>

      {/* Bar Chart per scope */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">Rata-rata per Aspek Perkembangan</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading || barData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              {loading ? 'Memuat data...' : 'Belum ada data'}
            </div>
          ) : (
            <ChartContainer config={barConfig} className="h-64 w-full">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} ticks={[1, 2, 3, 4]} />
                <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
                        <p className="font-medium">{payload[0].payload.label}</p>
                        <p className="text-muted-foreground">Rata-rata: <strong>{Number(payload[0].value).toFixed(2)}</strong></p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.scope} fill={getScoreColor(entry.avgScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
