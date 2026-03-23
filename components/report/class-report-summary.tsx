'use client'

import { AttendanceTable, type AttendanceSummaryRow } from './attendance-table'
import { ScoreRadarChart, type ScoreMap } from './score-radar-chart'
import { MoodLineChart, type MoodTimeSeriesItem } from './mood-line-chart'
import { AssessmentSummaries, type AssessmentSummaryItem } from './assessment-summaries'

export type { AttendanceSummaryRow, ScoreMap, MoodTimeSeriesItem, AssessmentSummaryItem }

interface ClassReportSummaryProps {
    attendanceSummary: AttendanceSummaryRow[]
    scopeScores: Record<string, ScoreMap>
    moodTimeSeries: MoodTimeSeriesItem[]
    dateRangeLabel: string
    studentReportBasePath: string
    assessmentSummaries?: AssessmentSummaryItem[]
}

export function ClassReportSummary({
    attendanceSummary,
    scopeScores,
    moodTimeSeries,
    dateRangeLabel,
    studentReportBasePath,
    assessmentSummaries = [],
}: ClassReportSummaryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className='col-span-full'>
                <AttendanceTable
                    rows={attendanceSummary}
                    dateRangeLabel={dateRangeLabel}
                    studentReportBasePath={studentReportBasePath}
                />
            </div>
            <div className='col-span-1'>
                <ScoreRadarChart scopeScores={scopeScores} />
            </div>
            <div className='col-span-2'>
                <MoodLineChart moodTimeSeries={moodTimeSeries} />
            </div>
            <div className='col-span-full'>
                <AssessmentSummaries summaries={assessmentSummaries} />
            </div>
        </div>
    )
}
