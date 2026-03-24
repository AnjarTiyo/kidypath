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
import { sql, and, gte, lte, eq, count } from "drizzle-orm"
import { subDays, format, parseISO, getMonth, getDate, getYear } from "date-fns"

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: "Nilai Agama Moral",
  physical_motor: "Fisik Motorik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosial Emosional",
  art: "Seni",
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const startDate = searchParams.get("startDate") || format(subDays(new Date(), 29), "yyyy-MM-dd")
    const classroomId = searchParams.get("classroomId") || null

    // Derive topic context from endDate calendar position
    const endDateObj = parseISO(endDate)
    const monthNum = getMonth(endDateObj) + 1 // 1-indexed (1–12)
    const dayNum = getDate(endDateObj)
    const year = getYear(endDateObj)
    const weekNum = Math.min(4, Math.ceil(dayNum / 7))
    // Academic year: Aug–Jul cycle (month >= 7 means new academic year starts)
    const academicYear = monthNum >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`

    // Resolve topic hierarchy via date position (left-join chain, graceful null)
    const [semesterRow] = await db
      .select({ id: semesterTopics.id, title: semesterTopics.title })
      .from(semesterTopics)
      .where(eq(semesterTopics.academicYear, academicYear))
      .orderBy(semesterTopics.semesterNumber)
      .limit(1)

    let monthlyRow: { id: string; title: string } | null = null
    let weeklyRow: { id: string; title: string } | null = null

    if (semesterRow) {
      const [mr] = await db
        .select({ id: monthlyTopics.id, title: monthlyTopics.title })
        .from(monthlyTopics)
        .where(
          and(
            eq(monthlyTopics.semesterTopicId, semesterRow.id),
            eq(monthlyTopics.monthNumber, monthNum)
          )
        )
        .limit(1)
      monthlyRow = mr ?? null

      if (monthlyRow) {
        const [wr] = await db
          .select({ id: weeklyTopics.id, title: weeklyTopics.title })
          .from(weeklyTopics)
          .where(
            and(
              eq(weeklyTopics.monthlyTopicId, monthlyRow.id),
              eq(weeklyTopics.weekNumber, weekNum)
            )
          )
          .limit(1)
        weeklyRow = wr ?? null
      }
    }

    // Achievement query: aggregate by development scope
    const rows = await db
      .select({
        scopeName: developmentScopes.name,
        totalItems: count(),
        totalScore: sql<number>`SUM(CASE ${assessmentItems.score} WHEN 'BB' THEN 1 WHEN 'MB' THEN 2 WHEN 'BSH' THEN 3 WHEN 'BSB' THEN 4 END)`,
        countBB: sql<number>`COUNT(CASE WHEN ${assessmentItems.score} = 'BB' THEN 1 END)`,
        countMB: sql<number>`COUNT(CASE WHEN ${assessmentItems.score} = 'MB' THEN 1 END)`,
        countBSH: sql<number>`COUNT(CASE WHEN ${assessmentItems.score} = 'BSH' THEN 1 END)`,
        countBSB: sql<number>`COUNT(CASE WHEN ${assessmentItems.score} = 'BSB' THEN 1 END)`,
      })
      .from(assessmentItems)
      .innerJoin(dailyAssessments, eq(assessmentItems.dailyAssessmentId, dailyAssessments.id))
      .innerJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
      .where(
        and(
          gte(dailyAssessments.date, startDate),
          lte(dailyAssessments.date, endDate),
          classroomId ? eq(dailyAssessments.classroomId, classroomId) : undefined
        )
      )
      .groupBy(developmentScopes.name)

    const scopes = rows.map((r) => {
      const totalItems = Number(r.totalItems)
      const totalScore = Number(r.totalScore) || 0
      const maxTarget = totalItems * 3
      const achievement = maxTarget > 0 ? Math.round((totalScore / maxTarget) * 10000) / 100 : 0
      const avgScore = totalItems > 0 ? Math.round((totalScore / totalItems) * 100) / 100 : 0

      return {
        scope: r.scopeName || "",
        label: SCOPE_LABELS[r.scopeName || ""] || r.scopeName || "",
        totalScore,
        totalItems,
        maxTarget,
        achievement,
        avgScore,
        distribution: {
          BB: Number(r.countBB),
          MB: Number(r.countMB),
          BSH: Number(r.countBSH),
          BSB: Number(r.countBSB),
        },
      }
    })

    const sampleSize = scopes.reduce((a, s) => a + s.totalItems, 0)

    return NextResponse.json({
      topic: {
        weekly: weeklyRow ? { id: weeklyRow.id, title: weeklyRow.title } : null,
        monthly: monthlyRow ? { id: monthlyRow.id, title: monthlyRow.title } : null,
        semester: semesterRow ? { id: semesterRow.id, title: semesterRow.title } : null,
      },
      scopes,
      sampleSize,
    })
  } catch (error) {
    console.error("[dashboard/topic-achievement]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
