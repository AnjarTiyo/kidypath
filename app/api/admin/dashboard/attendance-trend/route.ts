import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { attendances } from "@/lib/db/schema"
import { count, sql, and, gte, lte, eq } from "drizzle-orm"
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

    const baseConditions = [
      eq(attendances.type, "check_in"),
      gte(attendances.date, startDate),
      lte(attendances.date, endDate),
    ]
    if (classroomId) baseConditions.push(eq(attendances.classroomId, classroomId))

    // Daily trend: present / sick / permission per date
    const trendRows = await db
      .select({
        date: attendances.date,
        present: sql<number>`COUNT(CASE WHEN ${attendances.status} = 'present' THEN 1 END)`,
        sick: sql<number>`COUNT(CASE WHEN ${attendances.status} = 'sick' THEN 1 END)`,
        permission: sql<number>`COUNT(CASE WHEN ${attendances.status} = 'permission' THEN 1 END)`,
      })
      .from(attendances)
      .where(and(...baseConditions))
      .groupBy(attendances.date)
      .orderBy(attendances.date)

    // Mood distribution
    const moodRows = await db
      .select({
        mood: attendances.mood,
        count: count(),
      })
      .from(attendances)
      .where(
        and(
          ...baseConditions,
          sql`${attendances.mood} IS NOT NULL`
        )
      )
      .groupBy(attendances.mood)

    const moodLabels: Record<string, string> = {
      bahagia: "Bahagia",
      sedih: "Sedih",
      marah: "Marah",
      takut: "Takut",
      jijik: "Jijik",
    }

    return NextResponse.json({
      trend: trendRows.map((r) => ({
        date: r.date,
        present: Number(r.present),
        sick: Number(r.sick),
        permission: Number(r.permission),
      })),
      moodDist: moodRows.map((r) => ({
        mood: r.mood || "unknown",
        label: moodLabels[r.mood || ""] || r.mood || "Lainnya",
        count: r.count,
      })),
    })
  } catch (error) {
    console.error("[dashboard/attendance-trend]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
