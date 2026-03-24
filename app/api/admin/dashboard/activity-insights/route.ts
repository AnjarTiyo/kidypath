import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { activityAgenda, assessmentItems, dailyAssessments } from "@/lib/db/schema"
import { sql, and, gte, lte, eq } from "drizzle-orm"
import { subDays, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const startDate = searchParams.get("startDate") || format(subDays(new Date(), 29), "yyyy-MM-dd")
    const classroomId = searchParams.get("classroomId")

    const agendaConditions = [
      gte(activityAgenda.date, startDate),
      lte(activityAgenda.date, endDate),
    ]
    if (classroomId) agendaConditions.push(eq(activityAgenda.classroomId, classroomId))

    // Top activities by frequency (group by description, count)
    const activityRows = await db
      .select({
        description: activityAgenda.description,
        date: activityAgenda.date,
        classroomId: activityAgenda.classroomId,
        count: sql<number>`COUNT(*)`,
      })
      .from(activityAgenda)
      .where(and(...agendaConditions))
      .groupBy(activityAgenda.description, activityAgenda.date, activityAgenda.classroomId)
      .orderBy(sql`count(*) DESC`)
      .limit(50)

    // For each activity date+classroom, get avg assessment score
    const enriched = await Promise.all(
      activityRows.slice(0, 20).map(async (act) => {
        const [scoreRow] = await db
          .select({
            avgScore: sql<number>`AVG(CASE ${assessmentItems.score}
              WHEN 'BB' THEN 1 WHEN 'MB' THEN 2 WHEN 'BSH' THEN 3 WHEN 'BSB' THEN 4 END)`,
          })
          .from(assessmentItems)
          .innerJoin(dailyAssessments, eq(assessmentItems.dailyAssessmentId, dailyAssessments.id))
          .where(
            and(
              eq(dailyAssessments.date, act.date!),
              act.classroomId
                ? eq(dailyAssessments.classroomId, act.classroomId)
                : undefined
            )
          )

        return {
          description: act.description || "—",
          count: Number(act.count),
          avgScoreOnDay: scoreRow?.avgScore
            ? Math.round(Number(scoreRow.avgScore) * 100) / 100
            : null,
        }
      })
    )

    // Aggregate by description (sum counts, avg scores)
    const byDesc = new Map<string, { count: number; scores: number[] }>()
    for (const a of enriched) {
      const existing = byDesc.get(a.description)
      if (existing) {
        existing.count += a.count
        if (a.avgScoreOnDay !== null) existing.scores.push(a.avgScoreOnDay)
      } else {
        byDesc.set(a.description, {
          count: a.count,
          scores: a.avgScoreOnDay !== null ? [a.avgScoreOnDay] : [],
        })
      }
    }

    const topActivities = Array.from(byDesc.entries())
      .map(([desc, v]) => ({
        description: desc,
        count: v.count,
        avgScoreOnDay:
          v.scores.length > 0
            ? Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 100) / 100
            : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({ topActivities })
  } catch (error) {
    console.error("[dashboard/activity-insights]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
