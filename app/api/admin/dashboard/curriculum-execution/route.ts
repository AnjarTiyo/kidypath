import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  lessonPlans,
  classrooms,
  assessmentItems,
  dailyAssessments,
  developmentScopes,
} from "@/lib/db/schema"
import { sql, and, gte, lte, eq, count } from "drizzle-orm"
import { subDays, format, eachDayOfInterval, isWeekend } from "date-fns"

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: "Nilai Agama Moral",
  physical_motor: "Fisik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosem",
  art: "Seni",
}

function countSchoolDays(start: string, end: string): number {
  const days = eachDayOfInterval({ start: new Date(start), end: new Date(end) })
  return days.filter((d) => !isWeekend(d)).length
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const startDate = searchParams.get("startDate") || format(subDays(new Date(), 29), "yyyy-MM-dd")

    const expectedDays = countSchoolDays(startDate, endDate)

    const classroomList = await db.select({ id: classrooms.id, name: classrooms.name }).from(classrooms)

    const result = await Promise.all(
      classroomList.map(async (cls) => {
        // Count lesson plans submitted in range
        const [planRow] = await db
          .select({ count: count() })
          .from(lessonPlans)
          .where(
            and(
              eq(lessonPlans.classroomId, cls.id!),
              gte(lessonPlans.date, startDate),
              lte(lessonPlans.date, endDate)
            )
          )

        const actualPlans = planRow.count
        const completionPct =
          expectedDays > 0 ? Math.min(100, Math.round((actualPlans / expectedDays) * 100)) : 0

        // Dates with plans submitted
        const planDates = await db
          .select({ date: lessonPlans.date })
          .from(lessonPlans)
          .where(
            and(
              eq(lessonPlans.classroomId, cls.id!),
              gte(lessonPlans.date, startDate),
              lte(lessonPlans.date, endDate)
            )
          )

        const submittedDates = new Set(planDates.map((p) => p.date))
        const allSchoolDays = eachDayOfInterval({
          start: new Date(startDate),
          end: new Date(endDate),
        })
          .filter((d) => !isWeekend(d))
          .map((d) => format(d, "yyyy-MM-dd"))

        const missingDates = allSchoolDays
          .filter((d) => !submittedDates.has(d))
          .slice(0, 10)

        // Assessment scores per development scope
        const scopeRows = await db
          .select({
            scopeName: developmentScopes.name,
            avgScore: sql<number>`AVG(CASE ${assessmentItems.score} WHEN 'BB' THEN 1 WHEN 'MB' THEN 2 WHEN 'BSH' THEN 3 WHEN 'BSB' THEN 4 END)`,
            total: count(),
          })
          .from(assessmentItems)
          .innerJoin(dailyAssessments, eq(assessmentItems.dailyAssessmentId, dailyAssessments.id))
          .innerJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
          .where(
            and(
              eq(dailyAssessments.classroomId, cls.id!),
              gte(dailyAssessments.date, startDate),
              lte(dailyAssessments.date, endDate)
            )
          )
          .groupBy(developmentScopes.name)

        const scopeScores = scopeRows.map((s) => ({
          scope: s.scopeName || "",
          label: SCOPE_LABELS[s.scopeName || ""] || s.scopeName || "",
          avgScore: s.avgScore ? Math.round(Number(s.avgScore) * 100) / 100 : 0,
          total: Number(s.total),
        }))

        const overallAvgScore =
          scopeScores.length > 0
            ? Math.round(
                (scopeScores.reduce((a, s) => a + s.avgScore, 0) / scopeScores.length) * 100
              ) / 100
            : null

        return {
          classroomId: cls.id,
          name: cls.name || "—",
          expectedDays,
          actualPlans,
          completionPct,
          missingDates,
          scopeScores,
          overallAvgScore,
        }
      })
    )

    return NextResponse.json({ classrooms: result })
  } catch (error) {
    console.error("[dashboard/curriculum-execution]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
