'use client'

import { startTransition, useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Legend,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { IconSchool } from '@tabler/icons-react'

interface ClassroomData {
  classroomId: string
  name: string
  studentCount: number
  attendanceRate: number
  avgScore: number
  scopeScores: Record<string, number>
}

const chartConfig = {
  attendanceRate: { label: 'Kehadiran (%)', color: '#10b981' },
  avgScore25: { label: 'Rata-rata Skor (×25)', color: '#6366f1' },
} satisfies ChartConfig

function getAttendanceBadge(rate: number) {
  if (rate >= 90) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{rate}%</Badge>
  if (rate >= 75) return <Badge className="bg-amber-100 text-amber-700 text-xs">{rate}%</Badge>
  return <Badge className="bg-red-100 text-red-700 text-xs">{rate}%</Badge>
}

function getScoreBadge(score: number) {
  if (score >= 3.5) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{score.toFixed(1)}</Badge>
  if (score >= 2.5) return <Badge className="bg-blue-100 text-blue-700 text-xs">{score.toFixed(1)}</Badge>
  if (score >= 1.5) return <Badge className="bg-amber-100 text-amber-700 text-xs">{score.toFixed(1)}</Badge>
  return <Badge className="bg-red-100 text-red-700 text-xs">{score.toFixed(1)}</Badge>
}

export function ClassroomPerformanceSection() {
  const { filters } = useDashboardFilters()
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    startTransition(() => setLoading(true))
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
    fetch(`/api/admin/dashboard/classroom-performance?${params}`)
      .then((r) => r.json())
      .then((d) => { setClassrooms(d.classrooms || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters.startDate, filters.endDate])

  const chartData = classrooms.map((c) => ({
    name: c.name,
    attendanceRate: c.attendanceRate,
    avgScore25: Math.round(c.avgScore * 25), // scale 0–100
  }))

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconSchool size={18} />
          Perbandingan Performa Kelas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Memuat data...
          </div>
        ) : (
          <>
            {/* Grouped Bar Chart */}
            {chartData.length > 0 && (
              <ChartContainer config={chartConfig} className="h-52 w-full">
                <BarChart data={chartData} barCategoryGap="25%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} width={30} />
                  <ChartTooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm space-y-1">
                          <p className="font-medium">{label}</p>
                          {payload.map((p) => (
                            <p key={String(p.dataKey)} style={{ color: p.color }}>
                              {p.name}: {p.value}{p.dataKey === 'attendanceRate' ? '%' : ''}
                              {p.dataKey === 'avgScore25' ? ` (${((Number(p.value)) / 25).toFixed(1)}/4)` : ''}
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                  <Bar dataKey="attendanceRate" fill="#10b981" radius={[3, 3, 0, 0]} name="Kehadiran (%)" />
                  <Bar dataKey="avgScore25" fill="#6366f1" radius={[3, 3, 0, 0]} name="Skor Rata-rata (skala 100)" />
                </BarChart>
              </ChartContainer>
            )}

            {/* Sortable Table */}
            {classrooms.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Kelas</th>
                      <th className="text-center py-2 px-2 font-medium">Siswa</th>
                      <th className="text-center py-2 px-2 font-medium">Kehadiran</th>
                      <th className="text-center py-2 px-2 font-medium">Rata-rata Skor</th>
                      <th className="text-left py-2 pl-4 font-medium">Aspek Terlemah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...classrooms]
                      .sort((a, b) => b.attendanceRate - a.attendanceRate)
                      .map((cls) => {
                        const entries = Object.entries(cls.scopeScores)
                        const weakest = entries.sort((a, b) => a[1] - b[1])[0]
                        return (
                          <tr key={cls.classroomId} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 pr-4 font-medium">{cls.name}</td>
                            <td className="text-center py-2 px-2">{cls.studentCount}</td>
                            <td className="text-center py-2 px-2">{getAttendanceBadge(cls.attendanceRate)}</td>
                            <td className="text-center py-2 px-2">{getScoreBadge(cls.avgScore)}</td>
                            <td className="py-2 pl-4 text-xs text-muted-foreground">
                              {weakest ? (
                                <span className="flex items-center gap-1">
                                  {weakest[0]}
                                  <Badge variant="outline" className="text-[10px] px-1">{weakest[1].toFixed(1)}</Badge>
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {classrooms.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Belum ada data kelas</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
