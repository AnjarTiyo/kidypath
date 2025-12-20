"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getDevelopmentScopeLabel } from "@/lib/ai/lesson-plan-generator"
import { IconSparkles } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

type DevelopmentScope = 'religious_moral' | 'physical_motor' | 'cognitive' | 'language' | 'social_emotional' | 'art';

interface LessonPlanItem {
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface LessonPlanAgendaCardProps {
  items: LessonPlanItem[]
  errors: Record<string, string>
  onItemChange: (scope: DevelopmentScope, field: 'learningGoal' | 'activityContext', value: string) => void
}

const developmentScopes: DevelopmentScope[] = [
  'religious_moral',
  'physical_motor',
  'cognitive',
  'language',
  'social_emotional',
  'art'
]

export function LessonPlanAgendaCard({
  items,
  errors,
  onItemChange,
}: LessonPlanAgendaCardProps) {
  const getItem = (scope: DevelopmentScope) => {
    return items.find(item => item.developmentScope === scope) || {
      developmentScope: scope,
      learningGoal: "",
      activityContext: "",
      generatedByAi: false,
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-md">Rincian Agenda</CardTitle>
          <CardDescription className="text-xs">
            Isi tujuan pembelajaran dan aktivitas untuk setiap aspek perkembangan
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-semibold w-[120px]">Aspek</th>
                  <th className="text-left p-2 font-semibold">Tujuan Pembelajaran</th>
                  <th className="text-left p-2 font-semibold">Konteks & Aktivitas</th>
                </tr>
              </thead>
              <tbody>
                {developmentScopes.map((scope) => {
                  const item = getItem(scope)
                  return (
                    <tr
                      key={scope}
                      className={cn(
                        "border-b last:border-b-0",
                        errors[`goal_${scope}`] || errors[`activity_${scope}`]
                          ? "bg-destructive/5"
                          : ""
                      )}
                    >
                      <td className="p-2 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-xs leading-tight">
                            {getDevelopmentScopeLabel(scope)}
                          </span>
                          {item.generatedByAi && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 w-fit">
                              <IconSparkles className="h-2 w-2" />
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <Textarea
                          placeholder="Tujuan pembelajaran..."
                          value={item.learningGoal}
                          onChange={(e) => onItemChange(scope, 'learningGoal', e.target.value)}
                          rows={2}
                          className={cn(
                            "resize-none text-xs border-0 shadow-none focus-visible:ring-1 p-1",
                            errors[`goal_${scope}`] && "border border-destructive"
                          )}
                        />
                        {errors[`goal_${scope}`] && (
                          <p className="text-[10px] text-destructive mt-1">{errors[`goal_${scope}`]}</p>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        <Textarea
                          placeholder="Konteks & aktivitas..."
                          value={item.activityContext}
                          onChange={(e) => onItemChange(scope, 'activityContext', e.target.value)}
                          rows={2}
                          className={cn(
                            "resize-none text-xs border-0 shadow-none focus-visible:ring-1 p-1",
                            errors[`activity_${scope}`] && "border border-destructive"
                          )}
                        />
                        {errors[`activity_${scope}`] && (
                          <p className="text-[10px] text-destructive mt-1">{errors[`activity_${scope}`]}</p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
