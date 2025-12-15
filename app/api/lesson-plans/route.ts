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

    // Use query builder to get lesson plans with items
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
    
    const lessonPlansList = await db.query.lessonPlans.findMany({
      where: whereCondition,
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.createdAt)],
        },
        classroom: {
          columns: {
            name: true,
          },
        },
        creator: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: sortOrder === "asc" ? [asc(lessonPlans.date)] : [desc(lessonPlans.date)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    // Format the response
    const data = lessonPlansList.map(lp => ({
      id: lp.id,
      classroomId: lp.classroomId,
      classroomName: lp.classroom?.name,
      date: lp.date,
      title: lp.title,
      code: lp.code,
      generatedByAi: lp.generatedByAi,
      createdBy: lp.createdBy,
      createdByName: lp.creator?.name,
      createdAt: lp.createdAt,
      updatedAt: lp.updatedAt,
      items: lp.items,
    }))

    // Debug logging
    if (data.length > 0) {
      console.log(`[API] Returning ${data.length} lesson plan(s)`)
      console.log(`[API] First lesson plan has ${data[0].items?.length || 0} items`)
      if (data[0].items && data[0].items.length > 0) {
        console.log(`[API] First item:`, {
          scope: data[0].items[0].developmentScope,
          hasGoal: !!data[0].items[0].learningGoal,
          hasActivity: !!data[0].items[0].activityContext,
        })
      }
    }

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
    const { classroomId, date, title, code, items, generatedByAi = false } = body

    // Validation
    if (!classroomId || !date || !title || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Classroom ID, date, title, and items are required" },
        { status: 400 }
      )
    }

    // Validate that we have all 6 development scopes
    const requiredScopes = ['religious_moral', 'physical_motor', 'cognitive', 'language', 'social_emotional', 'art']
    const presentScopes = new Set(items.map((item: any) => item.developmentScope))
    
    if (items.length !== 6 || !requiredScopes.every(scope => presentScopes.has(scope))) {
      return NextResponse.json(
        { error: "Lesson plan must include all 6 development scopes" },
        { status: 400 }
      )
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.learningGoal || !item.activityContext) {
        return NextResponse.json(
          { error: "Each item must have learningGoal and activityContext" },
          { status: 400 }
        )
      }
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

    // Create lesson plan and items in a transaction
    const result = await db.transaction(async (tx) => {
      // Insert lesson plan
      const [newLessonPlan] = await tx
        .insert(lessonPlans)
        .values({
          classroomId,
          date,
          title,
          code: code || null,
          generatedByAi,
          createdBy: session.user.id,
        })
        .returning()

      // Import lessonPlanItems from schema
      const { lessonPlanItems } = await import('@/lib/db/schema')

      // Insert all lesson plan items
      const newItems = await tx
        .insert(lessonPlanItems)
        .values(
          items.map((item: any) => ({
            lessonPlanId: newLessonPlan.id,
            developmentScope: item.developmentScope,
            learningGoal: item.learningGoal,
            activityContext: item.activityContext,
            generatedByAi: item.generatedByAi || generatedByAi,
          }))
        )
        .returning()

      return {
        ...newLessonPlan,
        items: newItems,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating lesson plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
