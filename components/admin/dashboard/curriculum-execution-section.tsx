'use client'

import { useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { IconListCheck } from '@tabler/icons-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface ScopeScore {
  scope: string
  label: string
  avgScore: number
  total: number
}

interface CurriculumClassroom {
  classroomId: string
  name: string
  expectedDays: number
  actualPlans: number
  completionPct: number
  missingDates: string[]
  scopeScores: ScopeScore[]
  overallAvgScore: number | null
}

function formatDate(d: string) {
  try { return format(parseISO(d), 'd MMM', { locale: idLocale }) }
  catch { return d }
}

export function CurriculumExecutionSection() {
  const { filters } = useDashboardFilters()
  const [classrooms, setClassrooms] = useState<CurriculumClassroom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
    fetch(`/api/admin/dashboard/curriculum-execution?${params}`)
      .then((r) => r.json())
      .then((d) => { setClassrooms(d.classrooms || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters.startDate, filters.endDate])

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconListCheck size={18} />
          Pelaksanaan Kurikulum per Kelas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Memuat data...</div>
        ) : classrooms.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Belum ada data</div>
        ) : (
          <div className="space-y-5">
            {classrooms.map((cls) => (
              <div key={cls.classroomId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{cls.name}</span>
                    <Badge
                      className={
                        cls.completionPct >= 80
                          ? 'bg-emerald-100 text-emerald-700 text-[10px]'
                          : cls.completionPct >= 50
                          ? 'bg-amber-100 text-amber-700 text-[10px]'
                          : 'bg-red-100 text-red-700 text-[10px]'
                      }
                    >
                      {cls.completionPct}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>{cls.actualPlans}/{cls.expectedDays} hari</span>
                  </div>
                </div>
                <Progress value={cls.completionPct} className="h-2" />
                {cls.scopeScores && cls.scopeScores.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cls.scopeScores.map((s) => (
                      <span
                        key={s.scope}
                        className="text-[11px] bg-muted rounded px-2 py-0.5 flex items-center gap-1"
                      >
                        <span className="font-medium">{s.label}</span>
                        <span
                          className={
                            s.avgScore >= 3
                              ? 'text-emerald-600'
                              : s.avgScore >= 2
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }
                        >
                          {s.avgScore.toFixed(2)}
                        </span>
                      </span>
                    ))}
                    {cls.overallAvgScore !== null && (
                      <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 rounded px-2 py-0.5">
                        Rata-rata: {cls.overallAvgScore.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
                {cls.missingDates.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="text-[11px] text-muted-foreground mr-1">Belum diisi:</span>
                    {cls.missingDates.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px] border-amber-300 text-amber-700 px-1.5">
                        {formatDate(d)}
                      </Badge>
                    ))}
                    {cls.expectedDays - cls.actualPlans > cls.missingDates.length && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5">
                        +{cls.expectedDays - cls.actualPlans - cls.missingDates.length} lainnya
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
