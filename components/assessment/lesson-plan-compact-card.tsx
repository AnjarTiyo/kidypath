"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconSparkles, IconChecklist, IconAlertCircle } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"

interface LessonPlanItem {
    id: string
    developmentScope: string
    learningGoal: string
    activityContext: string
    generatedByAi?: boolean
}

interface LessonPlanCompactCardProps {
    lessonPlan: {
        id: string
        topic: string
        subtopic?: string | null
        code?: string
        generatedByAi?: boolean
        items: LessonPlanItem[]
    }
    assessmentProgress: {
        totalStudents: number
        assessedStudents: number
    }
    onAssess: () => void
}

const developmentScopeLabels: Record<string, string> = {
    religious_moral: "NAM",
    physical_motor: "FM",
    cognitive: "Kog",
    language: "Bhs",
    social_emotional: "SE",
    art: "Seni"
}

const developmentScopeColors: Record<string, string> = {
    religious_moral: "bg-purple-100 text-purple-700 border-purple-200",
    physical_motor: "bg-green-100 text-green-700 border-green-200",
    cognitive: "bg-blue-100 text-blue-700 border-blue-200",
    language: "bg-yellow-100 text-yellow-700 border-yellow-200",
    social_emotional: "bg-pink-100 text-pink-700 border-pink-200",
    art: "bg-orange-100 text-orange-700 border-orange-200"
}

export function LessonPlanCompactCard({
    lessonPlan,
    assessmentProgress,
    onAssess
}: LessonPlanCompactCardProps) {
    const progressPercentage = assessmentProgress.totalStudents > 0
        ? (assessmentProgress.assessedStudents / assessmentProgress.totalStudents) * 100
        : 0

    const hasIncompleteAssessment = assessmentProgress.assessedStudents < assessmentProgress.totalStudents

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b">
                <CardTitle className="text-sm">Data Rencana Pembelajaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                                {lessonPlan.topic}
                                {lessonPlan.subtopic && (
                                    <span className="text-muted-foreground font-normal"> - {lessonPlan.subtopic}</span>
                                )}
                            </h3>
                            {lessonPlan.generatedByAi && (
                                <IconSparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            )}
                        </div>
                        {lessonPlan.code && (
                            <p className="text-xs text-muted-foreground">{lessonPlan.code}</p>
                        )}
                    </div>
                </div>

                {/* Development Scopes - Compact Pills */}
                <div className="flex flex-wrap gap-1.5">
                    {lessonPlan.items.map((item) => (
                        <Badge
                            key={item.id}
                            variant="outline"
                            className={`${developmentScopeColors[item.developmentScope] || ""} text-[10px] px-1.5 py-0.5 font-medium`}
                        >
                            {developmentScopeLabels[item.developmentScope] || item.developmentScope}
                        </Badge>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progres Penilaian</span>
                        <span className="font-medium">
                            {assessmentProgress.assessedStudents}/{assessmentProgress.totalStudents}
                        </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* CTA Button */}
                {hasIncompleteAssessment && (
                    <Button
                        onClick={onAssess}
                        className="w-full"
                        size="sm"
                        variant="default"
                    >
                        <IconChecklist className="h-4 w-4 mr-2" />
                        Lakukan Penilaian
                    </Button>
                )}

                {!hasIncompleteAssessment && assessmentProgress.totalStudents > 0 && (
                    <div className="flex items-center justify-center gap-2 text-xs text-green-600 py-2">
                        <IconChecklist className="h-4 w-4" />
                        <span className="font-medium">Penilaian Selesai</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
