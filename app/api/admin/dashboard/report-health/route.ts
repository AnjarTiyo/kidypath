import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { weeklyReports, monthlyReports, students } from "@/lib/db/schema"
import { sql, and, gte, lte, eq, count } from "drizzle-orm"
import { subDays, format, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const startDate = searchParams.get("startDate") || format(subDays(new Date(), 29), "yyyy-MM-dd")

    const [totalStudentsRow] = await db.select({ count: count() }).from(students)
    const totalStudents = totalStudentsRow.count

    // Weekly report trend (group by week_start, count published)
    const weeklyRows = await db
      .select({
        weekStart: weeklyReports.weekStart,
        published: sql<number>`COUNT(CASE WHEN ${weeklyReports.isPublished} = true THEN 1 END)`,
        total: count(),
      })
      .from(weeklyReports)
      .where(
        and(
          gte(weeklyReports.weekStart, startDate),
          lte(weeklyReports.weekEnd, endDate)
        )
      )
      .groupBy(weeklyReports.weekStart)
      .orderBy(weeklyReports.weekStart)

    const weeklyTrend = weeklyRows.map((r) => ({
      week: r.weekStart,
      completionPct:
        totalStudents > 0
          ? Math.min(100, Math.round((Number(r.published) / totalStudents) * 100))
          : 0,
      published: Number(r.published),
      total: r.total,
    }))

    // Monthly report trend
    const monthlyRows = await db
      .select({
        month: monthlyReports.month,
        year: monthlyReports.year,
        total: count(),
      })
      .from(monthlyReports)
      .groupBy(monthlyReports.month, monthlyReports.year)
      .orderBy(monthlyReports.year, monthlyReports.month)
      .limit(12)

    const monthlyTrend = monthlyRows.map((r) => ({
      label: `${r.month}/${r.year}`,
      completionPct:
        totalStudents > 0
          ? Math.min(100, Math.round((r.total / totalStudents) * 100))
          : 0,
      total: r.total,
    }))

    // Missing reports: students who have NO weekly report in the last completed week
    const lastWeekStart = format(
      startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
      "yyyy-MM-dd"
    )
    const lastWeekEnd = format(
      endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
      "yyyy-MM-dd"
    )

    const studentsWithReport = await db
      .select({ studentId: weeklyReports.studentId })
      .from(weeklyReports)
      .where(
        and(
          eq(weeklyReports.weekStart, lastWeekStart),
          eq(weeklyReports.weekEnd, lastWeekEnd)
        )
      )

    const reportStudentIds = new Set(studentsWithReport.map((r) => r.studentId))

    const allStudents = await db.select({ id: students.id, fullName: students.fullName }).from(students)
    const missingStudents = allStudents
      .filter((s) => !reportStudentIds.has(s.id))
      .slice(0, 20)
      .map((s) => ({
        type: "weekly" as const,
        studentId: s.id,
        studentName: s.fullName || "—",
        period: `${lastWeekStart} s/d ${lastWeekEnd}`,
      }))

    return NextResponse.json({ weeklyTrend, monthlyTrend, missingReports: missingStudents })
  } catch (error) {
    console.error("[dashboard/report-health]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
