'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreDistributionBadge, SCORE_LABELS, SCORE_COLORS } from './score-distribution-badge'
import { IconUser, IconHeartbeat, IconBrain } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: 'Agama & Moral',
  physical_motor: 'Fisik Motorik',
  cognitive: 'Kognitif',
  language: 'Bahasa',
  social_emotional: 'Sosial Emosional',
  art: 'Seni',
}

const MOOD_LABELS: Record<string, string> = {
  bahagia: '😊 Bahagia',
  sedih: '😢 Sedih',
  marah: '😠 Marah',
  takut: '😨 Takut',
  jijik: '🤢 Jijik',
}

interface StudentInfo {
  id: string
  fullName: string | null
  classroomId: string | null
  birthDate: string | null
  gender: string | null
}

interface ScopeEntry {
  date: string | null
  score: string | null
  activityContext: string | null
  note: string | null
}

interface ObjectiveGroup {
  objectiveId: string | null
  objectiveDescription: string | null
  entries: ScopeEntry[]
}

interface ScopeBreakdown {
  scope: string
  scoreSummary: Record<string, number>
  objectives: ObjectiveGroup[]
}

interface StudentReportCardProps {
  student: StudentInfo
  attendanceStats: { present: number; sick: number; permission: number }
  moodDistribution: Record<string, number>
  scopeBreakdown: ScopeBreakdown[]
  dateRangeLabel: string
}

export function StudentReportCard({
  student,
  attendanceStats,
  moodDistribution,
  scopeBreakdown,
  dateRangeLabel,
}: StudentReportCardProps) {
  const totalAttendance =
    attendanceStats.present + attendanceStats.sick + attendanceStats.permission

  return (
    <div className="space-y-6">
      {/* Student identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconUser size={18} />
            {student.fullName ?? '—'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Periode: {dateRangeLabel}</p>
          {student.gender && (
            <p className="text-sm text-muted-foreground capitalize">Jenis Kelamin: {student.gender}</p>
          )}
        </CardContent>
      </Card>

      {/* Attendance stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📅 Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              <p className="text-xs text-muted-foreground">Hadir</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.sick}</p>
              <p className="text-xs text-muted-foreground">Sakit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-500">{attendanceStats.permission}</p>
              <p className="text-xs text-muted-foreground">Izin</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{totalAttendance}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Mood */}
          {Object.keys(moodDistribution).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Mood dominan:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(moodDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mood, count]) => (
                    <Badge key={mood} variant="outline" className="gap-1">
                      {MOOD_LABELS[mood] ?? mood} ×{count}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-scope breakdown */}
      {scopeBreakdown.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada penilaian pada periode ini
          </CardContent>
        </Card>
      )}

      {scopeBreakdown.map((scopeGroup) => (
        <Card key={scopeGroup.scope}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <IconBrain size={16} />
                {SCOPE_LABELS[scopeGroup.scope] ?? scopeGroup.scope}
              </span>
              <div className="flex gap-1">
                {Object.entries(scopeGroup.scoreSummary)
                  .filter(([, count]) => count > 0)
                  .map(([score, count]) => (
                    <ScoreDistributionBadge key={score} score={score} count={count} />
                  ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scopeGroup.objectives.map((obj, i) => (
                <div key={obj.objectiveId ?? i} className="border rounded-sm p-3 space-y-2">
                  {obj.objectiveDescription && (
                    <p className="text-sm font-medium">{obj.objectiveDescription}</p>
                  )}
                  <div className="space-y-1">
                    {obj.entries.map((entry, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="shrink-0 text-muted-foreground/60">{entry.date}</span>
                        {entry.score && (
                          <Badge
                            variant="outline"
                            className={cn('shrink-0 text-[10px] px-1 py-0', SCORE_COLORS[entry.score])}
                          >
                            {entry.score}
                          </Badge>
                        )}
                        {entry.activityContext && <span>{entry.activityContext}</span>}
                        {entry.note && (
                          <span className="italic text-muted-foreground">({entry.note})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
