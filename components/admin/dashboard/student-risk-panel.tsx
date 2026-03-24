'use client'

import { useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconAlertTriangle, IconStar } from '@tabler/icons-react'

interface StudentRisk {
  studentId: string
  name: string
  classroom: string
  attendanceRate: number | null
  avgScore: number | null
  riskReasons: string[]
}

interface StudentTop {
  studentId: string
  name: string
  classroom: string
  attendanceRate: number | null
  avgScore: number | null
  highScopeCount: number
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline" className="text-xs">—</Badge>
  if (score >= 3.5) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{score.toFixed(1)}</Badge>
  if (score >= 2.5) return <Badge className="bg-blue-100 text-blue-700 text-xs">{score.toFixed(1)}</Badge>
  if (score >= 1.5) return <Badge className="bg-amber-100 text-amber-700 text-xs">{score.toFixed(1)}</Badge>
  return <Badge className="bg-red-100 text-red-700 text-xs">{score.toFixed(1)}</Badge>
}

export function StudentRiskPanel() {
  const { filters } = useDashboardFilters()
  const [atRisk, setAtRisk] = useState<StudentRisk[]>([])
  const [topPerformers, setTopPerformers] = useState<StudentTop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    })
    fetch(`/api/admin/dashboard/student-risk?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setAtRisk(d.atRisk || [])
        setTopPerformers(d.topPerformers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* At-Risk Panel */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader className="dark:bg-red-950/30 border-b border-red-200 dark:border-red-900">
          <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
            <IconAlertTriangle size={18} />
            Siswa Berisiko ({loading ? '…' : atRisk.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 p-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat data...</div>
          ) : atRisk.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              ✅ Tidak ada siswa berisiko
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-4 font-medium">Siswa</th>
                    <th className="text-center py-2 px-2 font-medium">Skor</th>
                    <th className="text-left py-2 px-2 font-medium">Alasan Risiko</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((s) => (
                    <tr key={s.studentId} className="border-b last:border-0 hover:bg-red-50/50 dark:hover:bg-red-950/10">
                      <td className="py-2 px-4">
                        <p className="font-medium leading-tight">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.classroom}</p>
                      </td>
                      <td className="text-center py-2 px-2">
                        <ScoreBadge score={s.avgScore} />
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex flex-wrap gap-1">
                          {s.riskReasons.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-red-300 text-red-600 px-1.5">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers Panel */}
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader className="dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-900">
          <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
            <IconStar size={18} />
            Siswa Berprestasi ({loading ? '…' : topPerformers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 p-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat data...</div>
          ) : topPerformers.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data siswa berprestasi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-4 font-medium">Siswa</th>
                    <th className="text-center py-2 px-2 font-medium">Skor</th>
                    <th className="text-center py-2 px-2 font-medium">Aspek ≥ 3.5</th>
                    <th className="text-center py-2 px-2 font-medium">Hadir</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((s) => (
                    <tr key={s.studentId} className="border-b last:border-0 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                      <td className="py-2 px-4">
                        <p className="font-medium leading-tight">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.classroom}</p>
                      </td>
                      <td className="text-center py-2 px-2">
                        <ScoreBadge score={s.avgScore} />
                      </td>
                      <td className="text-center py-2 px-2">
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          {s.highScopeCount}/6
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-2 text-xs">
                        {s.attendanceRate !== null ? `${s.attendanceRate}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
