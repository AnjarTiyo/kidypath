import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { lessonPlans, classrooms, users, classroomTeachers } from "@/lib/db/schema"
import { desc, asc, sql, or, ilike, eq, and, inArray } from "drizzle-orm"

// GET - List lesson plans with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const classroomId = searchParams.get("classroomId")
    const date = searchParams.get("date")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where conditions
    const conditions = []

    // For teachers, only show lesson plans for their classrooms
    if (session.user.role === "teacher") {
      const teacherClassrooms = await db
        .select({ classroomId: classroomTeachers.classroomId })
        .from(classroomTeachers)
        .where(eq(classroomTeachers.teacherId, session.user.id))

      const classroomIds = teacherClassrooms.map(tc => tc.classroomId).filter((id): id is string => id !== null)
      
      if (classroomIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
        })
      }

      conditions.push(inArray(lessonPlans.classroomId, classroomIds))
    }

    if (classroomId) {
      conditions.push(eq(lessonPlans.classroomId, classroomId))
    }

    if (date) {
      conditions.push(eq(lessonPlans.date, date))
    }

    if (month && year) {
      conditions.push(
        sql`EXTRACT(MONTH FROM ${lessonPlans.date}) = ${month} AND EXTRACT(YEAR FROM ${lessonPlans.date}) = ${year}`
      )
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(lessonPlans)

    if (conditions.length > 0) {
      countQuery.where(and(...conditions))
    }

    const [{ count }] = await countQuery

    // Build data query
    const dataQueryBuilder = db
      .select({
        id: lessonPlans.id,
        classroomId: lessonPlans.classroomId,
        classroomName: classrooms.name,
        date: lessonPlans.date,
        title: lessonPlans.title,
        code: lessonPlans.code,
        generatedByAi: lessonPlans.generatedByAi,
        content: lessonPlans.content,
        createdBy: lessonPlans.createdBy,
        createdByName: users.name,
        createdAt: lessonPlans.createdAt,
      })
      .from(lessonPlans)
      .leftJoin(classrooms, eq(lessonPlans.classroomId, classrooms.id))
      .leftJoin(users, eq(lessonPlans.createdBy, users.id))

    // Apply where conditions
    const dataQueryWithWhere = conditions.length > 0 
      ? dataQueryBuilder.where(and(...conditions))
      : dataQueryBuilder

    // Apply sorting
    const dataQueryWithSort = sortOrder === "asc"
      ? dataQueryWithWhere.orderBy(asc(lessonPlans.date))
      : dataQueryWithWhere.orderBy(desc(lessonPlans.date))

    // Apply pagination and execute
    const data = await dataQueryWithSort
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const totalPages = Math.ceil(count / pageSize)

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount: count,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching lesson plans:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new lesson plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only teachers and admins can create lesson plans
    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { classroomId, date, title, code, content, generatedByAi = false } = body

    // Validation
    if (!classroomId || !date || !title || !content) {
      return NextResponse.json(
        { error: "Classroom ID, date, title, and content are required" },
        { status: 400 }
      )
    }

    // Verify classroom exists
    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.id, classroomId))
      .limit(1)

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      )
    }

    // For teachers, verify they are assigned to this classroom
    if (session.user.role === "teacher") {
      const [assignment] = await db
        .select()
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, classroomId),
            eq(classroomTeachers.teacherId, session.user.id)
          )
        )
        .limit(1)

      if (!assignment) {
        return NextResponse.json(
          { error: "You are not assigned to this classroom" },
          { status: 403 }
        )
      }
    }

    // Check if lesson plan already exists for this date and classroom
    const [existing] = await db
      .select()
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.classroomId, classroomId),
          eq(lessonPlans.date, date)
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: "Lesson plan already exists for this date and classroom" },
        { status: 400 }
      )
    }

    // Create lesson plan
    const [newLessonPlan] = await db
      .insert(lessonPlans)
      .values({
        classroomId,
        date,
        title,
        code: code || null,
        content,
        generatedByAi,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json(newLessonPlan, { status: 201 })
  } catch (error) {
    console.error("Error creating lesson plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
