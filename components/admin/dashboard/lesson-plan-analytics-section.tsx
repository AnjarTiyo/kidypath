'use client'

import { startTransition, useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from 'recharts'
import { IconChalkboard, IconUser } from '@tabler/icons-react'

interface ClassroomData {
  classroomId: string
  name: string
  teachers: string[]
  totalPlans: number
  scopeDiversity: number
}

const chartConfig = {
  totalPlans: { label: 'Jumlah RP', color: '#6366f1' },
} satisfies ChartConfig

export function LessonPlanAnalyticsSection() {
  const { filters } = useDashboardFilters()
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomData | null>(null)

  useEffect(() => {
    startTransition(() => setLoading(true))
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
    fetch(`/api/admin/dashboard/lesson-plan-analytics?${params}`)
      .then((r) => r.json())
      .then((d) => { setClassrooms(d.classrooms || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters.startDate, filters.endDate])

  const chartData = classrooms.slice(0, 10).map((c) => ({
    name: c.name,
    totalPlans: c.totalPlans,
    classroomId: c.classroomId,
  }))

  return (
    <>
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconChalkboard size={18} />
            Analitik Rencana Pembelajaran per Kelas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat data...</div>
          ) : classrooms.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data rencana pembelajaran
            </div>
          ) : (
            <>
              {/* Bar Chart: Total plans per class */}
              <div>
                <p className="text-xs text-muted-foreground mb-3">Jumlah Rencana Pembelajaran per Kelas</p>
                <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(160, chartData.length * 36) }}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p className="text-muted-foreground">Jumlah RP: <strong>{payload[0].value}</strong></p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="totalPlans" radius={[0, 4, 4, 0]} fill="#6366f1" />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-3 font-medium">Kelas</th>
                      <th className="text-left py-2 px-2 font-medium">Guru</th>
                      <th className="text-center py-2 px-2 font-medium">Total RP</th>
                      <th className="text-center py-2 px-2 font-medium">Cakupan Aspek</th>
                      <th className="text-center py-2 px-2 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((c) => (
                      <tr key={c.classroomId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{c.name}</td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">
                          {c.teachers.map((t, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <IconUser className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Teacher {t}</span>
                              </div>
                            ))}
                        </td>
                        <td className="text-center py-2 px-2 font-semibold">{c.totalPlans}</td>
                        <td className="text-center py-2 px-2">
                          <Badge variant="outline" className="text-xs">{c.scopeDiversity} dari 6</Badge>
                        </td>
                        <td className="text-center py-2 px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => setSelectedClassroom(c)}
                          >
                            Lihat
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      {selectedClassroom && (
        <Dialog open={!!selectedClassroom} onOpenChange={() => setSelectedClassroom(null)}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail: {selectedClassroom.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total RP</p>
                  <p className="text-xl font-bold">{selectedClassroom.totalPlans}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Cakupan Aspek</p>
                  <p className="text-xl font-bold">{selectedClassroom.scopeDiversity} dari 6</p>
                </div>
              </div>

              {selectedClassroom.teachers.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Guru Pengampu</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClassroom.teachers.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                {selectedClassroom.scopeDiversity < 4 && (
                  <p>📚 Cakupan aspek perkembangan masih terbatas ({selectedClassroom.scopeDiversity}/6). Perlu diversifikasi aktivitas.</p>
                )}
                {selectedClassroom.totalPlans === 0 && (
                  <p>⚠️ Belum ada rencana pembelajaran yang dicatat untuk periode ini.</p>
                )}
                {selectedClassroom.totalPlans > 0 && selectedClassroom.scopeDiversity >= 5 && (
                  <p>✅ Kelas ini mencakup banyak aspek perkembangan. Pertahankan!</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
