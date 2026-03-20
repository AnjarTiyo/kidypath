import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { lessonPlans, classrooms, users, classroomTeachers } from "@/lib/db/schema"
import { DevelopmentScope, DEVELOPMENT_SCOPES } from "@/lib/types/development-scope"
import { eq, and } from "drizzle-orm"

interface LessonPlanRequestItem {
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface LessonPlanUpdateBody {
  topic: string
  subtopic?: string | null
  code?: string | null
  items: LessonPlanRequestItem[]
  date?: string
  generatedByAi?: boolean
}

// GET - Get single lesson plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Use query builder to get lesson plan with items
    const lessonPlan = await db.query.lessonPlans.findFirst({
      where: eq(lessonPlans.id, id),
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
    })

    if (!lessonPlan) {
      return NextResponse.json(
        { error: "Lesson plan not found" },
        { status: 404 }
      )
    }

    // For teachers, verify they have access to this classroom
    if (session.user.role === "teacher" && lessonPlan.classroomId) {
      const [assignment] = await db
        .select()
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, lessonPlan.classroomId),
            eq(classroomTeachers.teacherId, session.user.id)
          )
        )
        .limit(1)

      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Format response
    const response = {
      id: lessonPlan.id,
      classroomId: lessonPlan.classroomId,
      classroomName: lessonPlan.classroom?.name,
      date: lessonPlan.date,
      topic: lessonPlan.topic,
      subtopic: lessonPlan.subtopic,
      code: lessonPlan.code,
      generatedByAi: lessonPlan.generatedByAi,
      createdBy: lessonPlan.createdBy,
      createdByName: lessonPlan.creator?.name,
      createdAt: lessonPlan.createdAt,
      updatedAt: lessonPlan.updatedAt,
      items: lessonPlan.items,
    }

    // Debug logging
    console.log(`[API][GET ${id}] Lesson plan has ${response.items?.length || 0} items`)
    if (response.items && response.items.length > 0) {
      console.log(`[API][GET ${id}] First item:`, {
        scope: response.items[0].developmentScope,
        hasGoal: !!response.items[0].learningGoal,
        hasActivity: !!response.items[0].activityContext,
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching lesson plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update lesson plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body: LessonPlanUpdateBody = await request.json()
    const { topic, subtopic, code, items, date, generatedByAi } = body

    if (!topic || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Topic and items are required" },
        { status: 400 }
      )
    }

    // Validate that we have all 6 development scopes
    const requiredScopes = DEVELOPMENT_SCOPES
    const presentScopes = new Set(items.map((item) => item.developmentScope))
    
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

    // Get existing lesson plan
    const [existing] = await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json(
        { error: "Lesson plan not found" },
        { status: 404 }
      )
    }

    // For teachers, verify they have access to this classroom
    if (session.user.role === "teacher" && existing.classroomId) {
      const [assignment] = await db
        .select()
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, existing.classroomId),
            eq(classroomTeachers.teacherId, session.user.id)
          )
        )
        .limit(1)

      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // If date is changing, check for conflicts
    if (date && date !== existing.date && existing.classroomId) {
      const [conflict] = await db
        .select()
        .from(lessonPlans)
        .where(
          and(
            eq(lessonPlans.classroomId, existing.classroomId),
            eq(lessonPlans.date, date)
          )
        )
        .limit(1)

      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: "Lesson plan already exists for this date and classroom" },
          { status: 400 }
        )
      }
    }

    // Import lessonPlanItems
    const { lessonPlanItems } = await import('@/lib/db/schema')

    // Update lesson plan and items in a transaction
    const result = await db.transaction(async (tx) => {
      // Update lesson plan
      const updateData: Partial<typeof lessonPlans.$inferInsert> = {
        topic,
        updatedAt: new Date(),
      }
      if (date !== undefined) updateData.date = date
      if (subtopic !== undefined) updateData.subtopic = subtopic || null
      if (code !== undefined) updateData.code = code || null
      if (generatedByAi !== undefined) updateData.generatedByAi = generatedByAi

      const [updated] = await tx
        .update(lessonPlans)
        .set(updateData)
        .where(eq(lessonPlans.id, id))
        .returning()

      // Delete existing items
      await tx
        .delete(lessonPlanItems)
        .where(eq(lessonPlanItems.lessonPlanId, id))

      // Insert new items
      const newItems = await tx
        .insert(lessonPlanItems)
        .values(
          items.map((item) => ({
            lessonPlanId: id,
            developmentScope: item.developmentScope,
            learningGoal: item.learningGoal,
            activityContext: item.activityContext,
            generatedByAi: item.generatedByAi || generatedByAi,
            createdAt: new Date(),
          }))
        )
        .returning()

      return {
        ...updated,
        items: newItems,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating lesson plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete lesson plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Get existing lesson plan
    const [existing] = await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json(
        { error: "Lesson plan not found" },
        { status: 404 }
      )
    }

    // For teachers, verify they have access to this classroom
    if (session.user.role === "teacher" && existing.classroomId) {
      const [assignment] = await db
        .select()
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, existing.classroomId),
            eq(classroomTeachers.teacherId, session.user.id)
          )
        )
        .limit(1)

      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    await db.delete(lessonPlans).where(eq(lessonPlans.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lesson plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
