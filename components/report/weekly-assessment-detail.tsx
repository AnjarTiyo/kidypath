'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreDistributionBadge } from './score-distribution-badge'
import { IconTrophy, IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: 'Nilai Agama & Moral',
  physical_motor: 'Fisik Motorik',
  cognitive: 'Kognitif',
  language: 'Bahasa',
  social_emotional: 'Sosial Emosional',
  art: 'Seni',
}

export interface AssessmentObjective {
  objectiveId: string | null
  objectiveDescription: string | null
  entries: {
    date: string | null
    activityContext: string | null
    score: string | null
    note: string | null
  }[]
}

export interface AssessmentScopeGroup {
  scope: string
  objectives: AssessmentObjective[]
}

interface WeeklyAssessmentDetailProps {
  scopeBreakdown: AssessmentScopeGroup[]
}

export function WeeklyAssessmentDetail({ scopeBreakdown }: WeeklyAssessmentDetailProps) {
  const [openScopes, setOpenScopes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(scopeBreakdown.map((s) => [s.scope, true]))
  )

  const toggle = (scope: string) =>
    setOpenScopes((prev) => ({ ...prev, [scope]: !prev[scope] }))

  if (scopeBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconTrophy size={18} />
            Ringkasan Pencapaian
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Belum ada data penilaian pada periode ini
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconTrophy size={18} />
          Ringkasan Pencapaian
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {scopeBreakdown.map((group) => {
          const isOpen = openScopes[group.scope] ?? true
          const label = SCOPE_LABELS[group.scope] ?? group.scope
          return (
            <div key={group.scope} className="rounded-md border overflow-hidden">
              {/* Scope header */}
              <button
                onClick={() => toggle(group.scope)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted text-sm font-medium text-left transition-colors"
              >
                <span>{label}</span>
                {isOpen ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}
              </button>

              {isOpen && (
                <div className="divide-y">
                  {group.objectives.map((obj) => (
                    <div key={obj.objectiveId ?? '__none__'} className="px-4 py-3 space-y-2">
                      {obj.objectiveDescription && (
                        <p className="text-xs font-medium text-muted-foreground">
                          {obj.objectiveDescription}
                        </p>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-1 pr-3 w-24 font-medium">Tanggal</th>
                              <th className="text-left py-1 pr-3 font-medium">Konteks Kegiatan</th>
                              <th className="text-center py-1 pr-3 w-16 font-medium">Skor</th>
                              <th className="text-left py-1 font-medium">Catatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {obj.entries.map((entry, i) => (
                              <tr key={i} className="align-top border-t border-border/50">
                                <td className="py-1.5 pr-3 tabular-nums text-muted-foreground whitespace-nowrap">
                                  {entry.date
                                    ? new Date(entry.date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : '—'}
                                </td>
                                <td className="py-1.5 pr-3 leading-snug">
                                  {entry.activityContext ?? '—'}
                                </td>
                                <td className="py-1.5 pr-3 text-center">
                                  {entry.score ? (
                                    <ScoreDistributionBadge score={entry.score} />
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-1.5 text-muted-foreground leading-snug">
                                  {entry.note ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
