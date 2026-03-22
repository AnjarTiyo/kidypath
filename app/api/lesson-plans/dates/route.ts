import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { lessonPlans, classroomTeachers } from "@/lib/db/schema"
import { sql, eq, inArray, and } from "drizzle-orm"

// GET - Get lesson plan dates for a specific month/year
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      )
    }

    // Build where conditions
    const conditions = [
      sql`EXTRACT(MONTH FROM ${lessonPlans.date}) = ${month}`,
      sql`EXTRACT(YEAR FROM ${lessonPlans.date}) = ${year}`,
    ]

    // For teachers, only show lesson plans for their classrooms
    if (session.user.role === "teacher") {
      const teacherClassrooms = await db
        .select({ classroomId: classroomTeachers.classroomId })
        .from(classroomTeachers)
        .where(eq(classroomTeachers.teacherId, session.user.id))

      const classroomIds = teacherClassrooms
        .map((tc) => tc.classroomId)
        .filter((id): id is string => id !== null)

      if (classroomIds.length === 0) {
        return NextResponse.json({ dates: [], count: 0 })
      }

      conditions.push(inArray(lessonPlans.classroomId, classroomIds))
    }

    // Fetch dates
    const dates = await db
      .select({
        date: lessonPlans.date,
      })
      .from(lessonPlans)
      .where(and(...conditions))

    return NextResponse.json({
      dates: dates.map((d) => d.date),
      count: dates.length,
    })
  } catch (error) {
    console.error("Error fetching lesson plan dates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
