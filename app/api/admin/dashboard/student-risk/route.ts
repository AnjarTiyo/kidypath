import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  students,
  classrooms,
  attendances,
  assessmentItems,
  dailyAssessments,
  developmentScopes,
} from "@/lib/db/schema"
import { sql, and, gte, lte, eq, count } from "drizzle-orm"
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

    // Get all students (optionally filtered by classroom)
    const studentList = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        classroomId: students.classroomId,
        classroomName: classrooms.name,
      })
      .from(students)
      .leftJoin(classrooms, eq(students.classroomId, classrooms.id))
      .where(classroomId ? eq(students.classroomId, classroomId) : undefined)

    const result = await Promise.all(
      studentList.map(async (student) => {
        // Attendance rate
        const [attRow] = await db
          .select({
            total: count(),
            present: sql<number>`COUNT(CASE WHEN ${attendances.status} = 'present' THEN 1 END)`,
          })
          .from(attendances)
          .where(
            and(
              eq(attendances.studentId, student.id!),
              eq(attendances.type, "check_in"),
              gte(attendances.date, startDate),
              lte(attendances.date, endDate)
            )
          )

        const attendanceRate =
          attRow.total > 0 ? Math.round((Number(attRow.present) / attRow.total) * 100) : null

        // Avg score per scope
        const scopeRows = await db
          .select({
            scopeName: developmentScopes.name,
            avgScore: sql<number>`AVG(CASE ${assessmentItems.score}
              WHEN 'BB' THEN 1 WHEN 'MB' THEN 2 WHEN 'BSH' THEN 3 WHEN 'BSB' THEN 4 END)`,
          })
          .from(assessmentItems)
          .innerJoin(dailyAssessments, eq(assessmentItems.dailyAssessmentId, dailyAssessments.id))
          .innerJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
          .where(
            and(
              eq(dailyAssessments.studentId, student.id!),
              gte(dailyAssessments.date, startDate),
              lte(dailyAssessments.date, endDate)
            )
          )
          .groupBy(developmentScopes.name)

        const scopeAvgList = scopeRows.map((s) => ({
          scope: s.scopeName || "",
          avg: s.avgScore ? Number(s.avgScore) : 0,
        }))

        const overallAvg =
          scopeAvgList.length > 0
            ? Math.round(
                (scopeAvgList.reduce((acc, s) => acc + s.avg, 0) / scopeAvgList.length) * 100
              ) / 100
            : null

        // Risk reasons
        const riskReasons: string[] = []
        if (attendanceRate !== null && attendanceRate < 80) riskReasons.push(`Kehadiran ${attendanceRate}% < 80%`)
        const lowScopes = scopeAvgList.filter((s) => s.avg > 0 && s.avg < 2.0)
        if (lowScopes.length >= 2) riskReasons.push(`Skor rendah di ${lowScopes.length} aspek perkembangan`)

        // Top performer criteria
        const highScopes = scopeAvgList.filter((s) => s.avg >= 3.5)
        const isTop =
          highScopes.length >= 4 && (attendanceRate === null || attendanceRate >= 90)

        return {
          studentId: student.id,
          name: student.fullName || "—",
          classroom: student.classroomName || "—",
          attendanceRate,
          avgScore: overallAvg,
          riskReasons,
          isAtRisk: riskReasons.length > 0,
          isTop,
          highScopeCount: highScopes.length,
        }
      })
    )

    const atRisk = result
      .filter((s) => s.isAtRisk)
      .sort((a, b) => (a.avgScore ?? 4) - (b.avgScore ?? 4))
      .slice(0, 20)

    const topPerformers = result
      .filter((s) => s.isTop)
      .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
      .slice(0, 20)

    return NextResponse.json({ atRisk, topPerformers })
  } catch (error) {
    console.error("[dashboard/student-risk]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
