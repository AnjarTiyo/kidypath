import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  students,
  classrooms,
  attendances,
  weeklyReports,
} from "@/lib/db/schema"
import { count, sql, and, gte, lte, eq } from "drizzle-orm"
import { subDays, format, startOfWeek, endOfWeek } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const startDate = searchParams.get("startDate") || format(subDays(new Date(), 29), "yyyy-MM-dd")

    // This week bounds for attendance rate
    const today = new Date()
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")

    const [totalStudentsRow] = await db.select({ count: count() }).from(students)
    const [totalClassroomsRow] = await db.select({ count: count() }).from(classrooms)

    // Weekly attendance rate (check_in only)
    const [attendanceRow] = await db
      .select({
        total: count(),
        present: sql<number>`COUNT(CASE WHEN ${attendances.status} = 'present' THEN 1 END)`,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.type, "check_in"),
          gte(attendances.date, weekStart),
          lte(attendances.date, weekEnd)
        )
      )

    const weeklyAttendanceRate =
      attendanceRow.total > 0
        ? Math.round((Number(attendanceRow.present) / attendanceRow.total) * 100)
        : 0

    // Report completion % in date range (weekly reports published vs students)
    const [reportRow] = await db
      .select({ published: count() })
      .from(weeklyReports)
      .where(
        and(
          eq(weeklyReports.isPublished, true),
          gte(weeklyReports.weekStart, startDate),
          lte(weeklyReports.weekEnd, endDate)
        )
      )

    const totalStudents = totalStudentsRow.count || 0
    const reportCompletionPct =
      totalStudents > 0 ? Math.min(100, Math.round((reportRow.published / totalStudents) * 100)) : 0

    reportCompletionPct.toFixed(2)

    // Dominant mood in date range
    const moodRows = await db
      .select({
        mood: attendances.mood,
        count: count(),
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.type, "check_in"),
          gte(attendances.date, startDate),
          lte(attendances.date, endDate),
          sql`${attendances.mood} IS NOT NULL`
        )
      )
      .groupBy(attendances.mood)
      .orderBy(sql`count(*) DESC`)
      .limit(1)

    const dominantMood = moodRows[0]?.mood || "belum ada data"
    const dominantMoodCount = moodRows[0]?.count || 0

    // AI insight narrative (template-based)
    const moodLabels: Record<string, string> = {
      bahagia: "bahagia 😊",
      sedih: "sedih 😢",
      marah: "marah 😠",
      takut: "takut 😨",
      jijik: "jijik 😖",
    }
    const moodLabel = moodLabels[dominantMood] || dominantMood
    const aiInsight = `Minggu ini kehadiran siswa mencapai ${weeklyAttendanceRate}%. Suasana hati dominan adalah ${moodLabel} (${dominantMoodCount} catatan). Laporan mingguan terselesaikan ${reportCompletionPct}% dari target. ${weeklyAttendanceRate < 80 ? "⚠️ Perhatian: Tingkat kehadiran di bawah 80% — perlu tindak lanjut segera." : "✅ Kehadiran dalam kondisi baik."}`

    return NextResponse.json({
      totalStudents,
      totalClassrooms: totalClassroomsRow.count,
      weeklyAttendanceRate,
      reportCompletionPct,
      dominantMood,
      aiInsight,
    })
  } catch (error) {
    console.error("[dashboard/summary]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
