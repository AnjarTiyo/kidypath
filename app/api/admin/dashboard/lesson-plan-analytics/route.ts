import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  lessonPlans,
  lessonPlanItems,
  classroomTeachers,
  classrooms,
  users,
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

    const classroomList = await db.select({ id: classrooms.id, name: classrooms.name }).from(classrooms)

    const result = await Promise.all(
      classroomList.map(async (cls) => {
        // Count lesson plans for this classroom in date range
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

        const totalPlans = planRow.count

        // Get teacher names assigned to this classroom
        const teacherRows = await db
          .select({ name: users.fullName })
          .from(classroomTeachers)
          .innerJoin(users, eq(classroomTeachers.teacherId, users.id))
          .where(eq(classroomTeachers.classroomId, cls.id!))

        const teachers = teacherRows.map((t) => t.name || "—")

        // Scope diversity (distinct development scopes used in lesson plans)
        let scopeDiversity = 0
        if (totalPlans > 0) {
          const planIds = await db
            .select({ id: lessonPlans.id })
            .from(lessonPlans)
            .where(
              and(
                eq(lessonPlans.classroomId, cls.id!),
                gte(lessonPlans.date, startDate),
                lte(lessonPlans.date, endDate)
              )
            )
          if (planIds.length > 0) {
            const ids = planIds.map((p) => p.id)
            const scopeRows = await db
              .selectDistinct({ scope: lessonPlanItems.developmentScope })
              .from(lessonPlanItems)
              .where(sql`${lessonPlanItems.lessonPlanId} = ANY(${sql.raw(`ARRAY['${ids.join("','")}']::uuid[]`)})`)
            scopeDiversity = scopeRows.length
          }
        }

        return {
          classroomId: cls.id,
          name: cls.name || "—",
          teachers,
          totalPlans,
          scopeDiversity,
        }
      })
    )

    // Sort by total plans descending
    result.sort((a, b) => b.totalPlans - a.totalPlans)

    return NextResponse.json({ classrooms: result })
  } catch (error) {
    console.error("[dashboard/lesson-plan-analytics]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
