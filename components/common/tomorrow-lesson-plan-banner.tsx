"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import {
  IconAlertTriangle,
  IconCalendarPlus,
  IconCalendarOff,
  IconChartBar,
  IconLogin,
  IconLogout,
  IconFileCheck,
  IconSend,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { type TodayStatusItem, type TodayLessonPlanStatus } from "@/lib/hooks/use-today-daily-status"
import { type WeeklyReportStatus } from "@/lib/hooks/use-weekly-report-status"

interface Classroom {
  id: string
  name: string
  academicYear: string
  createdAt?: string
}

interface OutstandingTasksBannerProps {
  /** Next working day — null on Sundays (banner should not be rendered) */
  targetDate: Date | null
  missingClassrooms: Classroom[]
  todayLessonPlan: TodayLessonPlanStatus
  checkIn: TodayStatusItem
  assessment: TodayStatusItem
  checkOut: TodayStatusItem
  /** Populated only on Friday/Saturday; null on other days */
  weeklyReport: WeeklyReportStatus | null
}

interface TaskRowProps {
  icon: React.ElementType
  label: string
  subtitle?: string
  showProgress?: boolean
  completedCount?: number
  totalStudents?: number
  progressPercentage?: number
  actionLabel: string
  actionDisabled?: boolean
  onAction: () => void
}

function TaskRow({
  icon: Icon,
  label,
  subtitle,
  showProgress,
  completedCount,
  totalStudents,
  progressPercentage,
  actionLabel,
  actionDisabled,
  onAction,
}: TaskRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <Icon className="h-4 w-4 flex-shrink-0 text-amber-500" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-amber-800">{label}</p>
          {showProgress && totalStudents !== undefined && completedCount !== undefined && (
            <span className="text-xs text-amber-600 flex-shrink-0">
              {completedCount} / {totalStudents}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-amber-700">{subtitle}</p>
        )}
        {showProgress && progressPercentage !== undefined && (
          <Progress
            value={progressPercentage}
            className="mt-1.5 h-1.5 bg-amber-200 [&>div]:bg-amber-500"
          />
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onAction}
        disabled={actionDisabled}
        className="flex-shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-100 hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {actionLabel}
      </Button>
    </div>
  )
}

export function OutstandingTasksBanner({
  targetDate,
  missingClassrooms,
  todayLessonPlan,
  checkIn,
  assessment,
  checkOut,
  weeklyReport,
}: OutstandingTasksBannerProps) {
  const router = useRouter()

  const dayOfWeek = new Date().getDay()
  const isWeekEnd = dayOfWeek === 5 || dayOfWeek === 6

  const hasTomorrowLessonPlan = missingClassrooms.length > 0 && targetDate !== null
  const hasTodayLessonPlan = !todayLessonPlan.done
  const hasTodayOutstanding = !checkIn.done || !assessment.done || !checkOut.done
  const hasWeekEndReports =
    isWeekEnd &&
    weeklyReport !== null &&
    weeklyReport.totalStudents > 0 &&
    (weeklyReport.publishedCount < weeklyReport.totalStudents ||
      weeklyReport.sentCount < weeklyReport.totalStudents)

  const hasAnyOutstanding =
    hasTodayLessonPlan || hasTomorrowLessonPlan || hasTodayOutstanding || hasWeekEndReports

  if (!hasAnyOutstanding) return null

  const dateParam = targetDate ? format(targetDate, "yyyy-MM-dd") : ""
  const dateLabel = targetDate
    ? format(targetDate, "EEEE, d MMMM yyyy", { locale: localeId })
    : ""
  const classroomNames = missingClassrooms.map((c) => c.name).join(", ")
  const todayParam = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <IconAlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
        <p className="text-sm font-semibold text-amber-800">Ada tugas yang belum diselesaikan</p>
      </div>

      {/* Task rows — separated by a subtle divider */}
      <div className="divide-y divide-amber-100">

        {/* Today: no lesson plan — when this triggers, show ONLY this row */}
        {hasTodayLessonPlan ? (
          <TaskRow
            icon={IconCalendarOff}
            label="Tidak Ada rencana pembelajaran Hari Ini"
            subtitle={`Kelas belum memiliki RPPH untuk hari ini — ${format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}`}
            actionLabel="Buat RPPH"
            onAction={() => router.push(`/teacher/lesson-plan/new?date=${todayParam}`)}
          />
        ) : (
          <>
            {/* Tomorrow: no lesson plan */}
            {hasTomorrowLessonPlan && (
              <TaskRow
                icon={IconCalendarPlus}
                label="Rencana Pembelajaran esok hari belum dibuat"
                subtitle={`${dateLabel} — Kelas: ${classroomNames}`}
                actionLabel="Buat RPPH"
                onAction={() => router.push(`/teacher/lesson-plan/new?date=${dateParam}`)}
              />
            )}

            {/* Daily: check-in */}
            {!checkIn.done && (
              <TaskRow
                icon={IconLogin}
                label="Check-in Harian"
                showProgress={(checkIn.completedCount ?? 0) > 0}
                completedCount={checkIn.completedCount}
                totalStudents={checkIn.totalStudents}
                progressPercentage={checkIn.progressPercentage}
                actionLabel="Mulai"
                onAction={() => {
                  const classroomId = checkIn.firstIncompleteClassroomId
                  router.push(
                    classroomId
                      ? `/teacher/class/${classroomId}/check-in?date=${todayParam}`
                      : `/teacher/class`
                  )
                }}
              />
            )}

            {/* Daily: assessment */}
            {!assessment.done && (
              <TaskRow
                icon={IconChartBar}
                label="Penilaian Harian"
                showProgress
                completedCount={assessment.completedCount}
                totalStudents={assessment.totalStudents}
                progressPercentage={assessment.progressPercentage}
                actionLabel="Mulai"
                onAction={() => router.push(`/teacher/assesment`)}
              />
            )}

            {/* Daily: check-out */}
            {!checkOut.done && (
              <TaskRow
                icon={IconLogout}
                label="Check-out Harian"
                showProgress={(checkOut.completedCount ?? 0) > 0}
                completedCount={checkOut.completedCount}
                totalStudents={checkOut.totalStudents}
                progressPercentage={checkOut.progressPercentage}
                actionLabel="Mulai"
                onAction={() => {
                  const classroomId = checkOut.firstIncompleteClassroomId
                  router.push(
                    classroomId
                      ? `/teacher/class/${classroomId}/check-out?date=${todayParam}`
                      : `/teacher/class`
                  )
                }}
              />
            )}

            {/* End of week: publish & send weekly reports */}
            {hasWeekEndReports && weeklyReport && (
              <>
                {weeklyReport.publishedCount < weeklyReport.totalStudents && (
                  <TaskRow
                    icon={IconFileCheck}
                    label="Publikasi Laporan Mingguan"
                    showProgress
                    completedCount={weeklyReport.publishedCount}
                    totalStudents={weeklyReport.totalStudents}
                    progressPercentage={weeklyReport.publishedPercentage}
                    actionLabel="Kelola"
                    onAction={() => router.push("/teacher/report/weekly")}
                  />
                )}
                {weeklyReport.sentCount < weeklyReport.totalStudents && (
                  <TaskRow
                    icon={IconSend}
                    label="Kirim Laporan ke Orang Tua"
                    subtitle="Fitur pengiriman WhatsApp akan tersedia dalam pembaruan mendatang"
                    showProgress
                    completedCount={weeklyReport.sentCount}
                    totalStudents={weeklyReport.totalStudents}
                    progressPercentage={weeklyReport.sentPercentage}
                    actionLabel="Kirim"
                    actionDisabled
                    onAction={() => {/* TODO: integrate WhatsApp Business API */ }}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
