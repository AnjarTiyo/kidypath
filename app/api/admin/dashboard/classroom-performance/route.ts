import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  classrooms,
  students,
  attendances,
  assessmentItems,
  dailyAssessments,
  developmentScopes,
} from "@/lib/db/schema"
import { sql, and, gte, lte, eq, count } from "drizzle-orm"
import { subDays, format } from "date-fns"

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: "Nilai Agama Moral",
  physical_motor: "Fisik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosem",
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

    // All classrooms
    const classroomList = await db.select({ id: classrooms.id, name: classrooms.name }).from(classrooms)

    const result = await Promise.all(
      classroomList.map(async (cls) => {
        // Student count
        const [studentRow] = await db
          .select({ count: count() })
          .from(students)
          .where(eq(students.classroomId, cls.id))

        // Attendance rate (check_in present / total check_ins)
        const [attRow] = await db
          .select({
            total: count(),
            present: sql<number>`COUNT(CASE WHEN ${attendances.status} = 'present' THEN 1 END)`,
          })
          .from(attendances)
          .where(
            and(
              eq(attendances.classroomId, cls.id!),
              eq(attendances.type, "check_in"),
              gte(attendances.date, startDate),
              lte(attendances.date, endDate)
            )
          )

        const attendanceRate =
          attRow.total > 0 ? Math.round((Number(attRow.present) / attRow.total) * 100) : 0

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
              eq(dailyAssessments.classroomId, cls.id!),
              gte(dailyAssessments.date, startDate),
              lte(dailyAssessments.date, endDate)
            )
          )
          .groupBy(developmentScopes.name)

        const scopeScores: Record<string, number> = {}
        let totalAvg = 0
        let scopeCount = 0
        for (const s of scopeRows) {
          const key = SCOPE_LABELS[s.scopeName || ""] || s.scopeName || ""
          const val = s.avgScore ? Math.round(Number(s.avgScore) * 100) / 100 : 0
          scopeScores[key] = val
          totalAvg += val
          scopeCount++
        }

        return {
          classroomId: cls.id,
          name: cls.name || "—",
          studentCount: studentRow.count,
          attendanceRate,
          avgScore: scopeCount > 0 ? Math.round((totalAvg / scopeCount) * 100) / 100 : 0,
          scopeScores,
        }
      })
    )

    return NextResponse.json({ classrooms: result })
  } catch (error) {
    console.error("[dashboard/classroom-performance]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
