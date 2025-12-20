"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCheck, IconX, IconClock, IconProgress, IconPlus, IconEdit } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface StatusItemProps {
    label: string;
    isComplete: boolean;
    showProgress?: boolean;
    completedCount?: number;
    totalCount?: number;
    progressPercentage?: number;
    subtitle?: string;
    onAction?: () => void;
    actionLabel?: string;
}

interface DailyStatusIndicatorProps {
    lessonPlanStatus?: {
        isCreated: boolean
        topic?: string
        subtopic?: string
    }
    checkInStatus?: {
        isConducted: boolean
        completedCount?: number
        totalStudents?: number
    }
    assessmentStatus?: {
        completedCount: number
        totalStudents: number
        progressPercentage: number
    }
    checkOutStatus?: {
        isConducted: boolean
        completedCount?: number
        totalStudents?: number
    }
    onCreateLessonPlan?: () => void
    onEditLessonPlan?: () => void
    onCheckIn?: () => void
    onAssess?: () => void
    onCheckOut?: () => void
}

interface StatusItemProps {
    label: string
    isComplete: boolean
    showProgress?: boolean
    completedCount?: number
    totalCount?: number
    progressPercentage?: number
    subtitle?: string
    onAction?: () => void
    actionLabel?: string
}

function StatusItem({ 
    label, 
    isComplete, 
    showProgress = false, 
    completedCount, 
    totalCount,
    progressPercentage,
    subtitle,
    onAction,
    actionLabel
}: StatusItemProps) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className={cn(
                "mt-0.5 flex-shrink-0 rounded-full p-1",
                isComplete ? "bg-green-100" : "bg-gray-100"
            )}>
                {isComplete ? (
                    <IconCheck className="h-4 w-4 text-green-600" />
                ) : (
                    <IconClock className="h-4 w-4 text-gray-400" />
                )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-row items-start gap-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{label}</p>
                        {showProgress && totalCount !== undefined && completedCount !== undefined && (
                            <span className="text-xs text-muted-foreground ml-2">
                                {completedCount}/{totalCount}
                            </span>
                        )}
                    </div>
                    
                    {subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                    )}
                    
                    {showProgress && progressPercentage !== undefined && (
                        <Progress value={progressPercentage} className="h-1.5 mt-1.5" />
                    )}
                    
                    {!isComplete && !showProgress && !subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">Belum dilakukan</p>
                    )}
                </div>

                {onAction && (
                    <Button
                        onClick={onAction}
                        size="sm"
                        variant={isComplete ? "ghost" : "default"}
                        className={cn(
                            "h-7 text-xs flex-shrink-0",
                            isComplete && "text-green-600 hover:text-green-700 hover:bg-green-50"
                        )}
                    >
                        {isComplete ? (
                            <IconCheck className="h-4 w-4" />
                        ) : (
                            <>
                                <IconPlus className="h-3 w-3 mr-1" />
                                {actionLabel || "Mulai"}
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}

export function LessonPlanCompactCard({
    lessonPlanStatus = { isCreated: false },
    checkInStatus = { isConducted: false },
    assessmentStatus = { completedCount: 0, totalStudents: 0, progressPercentage: 0 },
    checkOutStatus = { isConducted: false },
    onCreateLessonPlan,
    onEditLessonPlan,
    onCheckIn,
    onAssess,
    onCheckOut
}: DailyStatusIndicatorProps) {
    const allComplete = 
        lessonPlanStatus?.isCreated && 
        checkInStatus?.isConducted && 
        assessmentStatus?.progressPercentage === 100 && 
        checkOutStatus?.isConducted

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Status Harian</CardTitle>
                    {allComplete && (
                        <div className="flex items-center gap-1 text-green-600">
                            <IconCheck className="h-4 w-4" />
                            <span className="text-xs font-medium">Selesai</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-1 divide-y">
                <StatusItem
                    label="Rencana Pembelajaran"
                    isComplete={lessonPlanStatus?.isCreated ?? false}
                    subtitle={lessonPlanStatus?.isCreated && lessonPlanStatus?.topic 
                        ? `${lessonPlanStatus.topic}${lessonPlanStatus.subtopic ? ` - ${lessonPlanStatus.subtopic}` : ''}`
                        : undefined
                    }
                    onAction={lessonPlanStatus?.isCreated ? onEditLessonPlan : onCreateLessonPlan}
                    actionLabel={lessonPlanStatus?.isCreated ? "Edit" : "Buat RPPH"}
                />
                
                <StatusItem
                    label="Check-in Harian"
                    isComplete={checkInStatus?.isConducted ?? false}
                    showProgress={!checkInStatus?.isConducted && (checkInStatus?.completedCount ?? 0) > 0}
                    completedCount={checkInStatus?.completedCount ?? 0}
                    totalCount={checkInStatus?.totalStudents ?? 0}
                    progressPercentage={checkInStatus?.totalStudents 
                        ? ((checkInStatus?.completedCount ?? 0) / checkInStatus.totalStudents) * 100 
                        : 0
                    }
                    subtitle={checkInStatus?.isConducted 
                        ? "Semua siswa sudah check-in"
                        : undefined
                    }
                    onAction={onCheckIn}
                    actionLabel="Check-in"
                />
                
                <StatusItem
                    label="Penilaian Harian"
                    isComplete={(assessmentStatus?.progressPercentage ?? 0) === 100}
                    showProgress={true}
                    completedCount={assessmentStatus?.completedCount ?? 0}
                    totalCount={assessmentStatus?.totalStudents ?? 0}
                    progressPercentage={assessmentStatus?.progressPercentage ?? 0}
                    onAction={onAssess}
                    actionLabel="Penilaian"
                />
                
                <StatusItem
                    label="Check-out Harian"
                    isComplete={checkOutStatus?.isConducted ?? false}
                    showProgress={!checkOutStatus?.isConducted && (checkOutStatus?.completedCount ?? 0) > 0}
                    completedCount={checkOutStatus?.completedCount ?? 0}
                    totalCount={checkOutStatus?.totalStudents ?? 0}
                    progressPercentage={checkOutStatus?.totalStudents 
                        ? ((checkOutStatus?.completedCount ?? 0) / checkOutStatus.totalStudents) * 100 
                        : 0
                    }
                    subtitle={checkOutStatus?.isConducted 
                        ? "Semua siswa sudah check-out"
                        : undefined
                    }
                    onAction={onCheckOut}
                    actionLabel="Check-out"
                />
            </CardContent>
        </Card>
    )
}
