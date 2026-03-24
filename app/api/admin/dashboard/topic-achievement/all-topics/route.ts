import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  assessmentItems,
  dailyAssessments,
  developmentScopes,
  semesterTopics,
  monthlyTopics,
  weeklyTopics,
} from "@/lib/db/schema"
import { sql, and, gte, lte, eq, count, inArray } from "drizzle-orm"
import { format, parseISO } from "date-fns"
import {
  getAcademicYearFromDate,
  getWeekOfMonth,
} from "@/lib/helpers/topic-helpers"

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: "Nilai Agama Moral",
  physical_motor: "Fisik Motorik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosial Emosional",
  art: "Seni",
}

function getWeekDateRange(
  monthNumber: number,
  weekNumber: number,
  academicYear: string
): { startDate: string; endDate: string } {
  const [startYearStr, endYearStr] = academicYear.split("/")
  const yearStart = parseInt(startYearStr, 10)
  const yearEnd = parseInt(endYearStr, 10)
  const year = monthNumber >= 7 ? yearStart : yearEnd
  const startDay = (weekNumber - 1) * 7 + 1
  const daysInMonth = new Date(year, monthNumber, 0).getDate() // day 0 of next month
  const endDay = Math.min(weekNumber * 7, daysInMonth)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return {
    startDate: `${year}-${pad(monthNumber)}-${pad(startDay)}`,
    endDate: `${year}-${pad(monthNumber)}-${pad(endDay)}`,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const classroomId = searchParams.get("classroomId") || null

    const endDateObj = parseISO(endDate)
    const academicYear = getAcademicYearFromDate(endDateObj)

    // 1 — All semester topics for this academic year
    const semesters = await db
      .select({
        id: semesterTopics.id,
        title: semesterTopics.title,
        semesterNumber: semesterTopics.semesterNumber,
      })
      .from(semesterTopics)
      .where(eq(semesterTopics.academicYear, academicYear))
      .orderBy(semesterTopics.semesterNumber)

    if (semesters.length === 0) {
      return NextResponse.json({ rows: [], academicYear })
    }

    const semesterIds = semesters.map((s) => s.id)

    // 2 — All monthly topics for those semesters
    const monthlies = await db
      .select({
        id: monthlyTopics.id,
        semesterTopicId: monthlyTopics.semesterTopicId,
        title: monthlyTopics.title,
        monthNumber: monthlyTopics.monthNumber,
      })
      .from(monthlyTopics)
      .where(inArray(monthlyTopics.semesterTopicId, semesterIds))
      .orderBy(monthlyTopics.monthNumber)

    if (monthlies.length === 0) {
      return NextResponse.json({ rows: [], academicYear })
    }

    const monthlyIds = monthlies.map((m) => m.id)

    // 3 — All weekly topics for those monthly topics
    const weeklies = await db
      .select({
        id: weeklyTopics.id,
        monthlyTopicId: weeklyTopics.monthlyTopicId,
        title: weeklyTopics.title,
        weekNumber: weeklyTopics.weekNumber,
      })
      .from(weeklyTopics)
      .where(inArray(weeklyTopics.monthlyTopicId, monthlyIds))
      .orderBy(weeklyTopics.weekNumber)

    if (weeklies.length === 0) {
      return NextResponse.json({ rows: [], academicYear })
    }

    const semesterMap = new Map(semesters.map((s) => [s.id, s]))
    const monthlyMap = new Map(monthlies.map((m) => [m.id, m]))

    // 4 — Query achievement per weekly topic (parallel)
    const rowPromises = weeklies.map(async (wt) => {
      const monthly = monthlyMap.get(wt.monthlyTopicId ?? "")
      const semester = monthly ? semesterMap.get(monthly.semesterTopicId ?? "") : undefined

      const monthNumber = monthly?.monthNumber ?? null
      const weekNumber = wt.weekNumber ?? null

      let startDate = ""
      let endDateRange = ""
      if (monthNumber != null && weekNumber != null) {
        const range = getWeekDateRange(monthNumber, weekNumber, academicYear)
        startDate = range.startDate
        endDateRange = range.endDate
      }

      let scopeRows: { scopeName: string | null; totalItems: number; totalScore: number }[] = []

      if (startDate && endDateRange) {
        const dbRows = await db
          .select({
            scopeName: developmentScopes.name,
            totalItems: count(),
            totalScore: sql<number>`COALESCE(SUM(CASE ${assessmentItems.score} WHEN 'BB' THEN 1 WHEN 'MB' THEN 2 WHEN 'BSH' THEN 3 WHEN 'BSB' THEN 4 END), 0)`,
          })
          .from(assessmentItems)
          .innerJoin(dailyAssessments, eq(assessmentItems.dailyAssessmentId, dailyAssessments.id))
          .innerJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
          .where(
            and(
              gte(dailyAssessments.date, startDate),
              lte(dailyAssessments.date, endDateRange),
              classroomId ? eq(dailyAssessments.classroomId, classroomId) : undefined
            )
          )
          .groupBy(developmentScopes.name)
        scopeRows = dbRows
      }

      const scopes = scopeRows.map((r) => {
        const totalItems = Number(r.totalItems)
        const totalScore = Number(r.totalScore) || 0
        const achievement = totalItems > 0
          ? Math.round((totalScore / (totalItems * 3)) * 10000) / 100
          : 0
        return {
          scope: r.scopeName || "",
          label: SCOPE_LABELS[r.scopeName || ""] || r.scopeName || "",
          totalItems,
          totalScore,
          achievement,
        }
      })

      const sampleSize = scopes.reduce((a, s) => a + s.totalItems, 0)
      const overallAchievement =
        sampleSize > 0
          ? Math.round(
              (scopes.reduce((a, s) => a + s.totalScore, 0) / (sampleSize * 3)) * 10000
            ) / 100
          : null

      return {
        weeklyTopicId: wt.id,
        weeklyTitle: wt.title,
        weekNumber: wt.weekNumber ?? null,
        monthlyTopicId: monthly?.id ?? "",
        monthlyTitle: monthly?.title ?? "",
        monthNumber: monthly?.monthNumber ?? null,
        semesterTopicId: semester?.id ?? "",
        semesterTitle: semester?.title ?? "",
        startDate,
        endDate: endDateRange,
        sampleSize,
        overallAchievement,
        scopes,
      }
    })

    const rows = await Promise.all(rowPromises)

    return NextResponse.json({ rows, academicYear })
  } catch (error) {
    console.error("[dashboard/topic-achievement/all-topics]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
