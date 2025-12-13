import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { lessonPlans, classrooms, users, classroomTeachers } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

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

    const [lessonPlan] = await db
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
      .where(eq(lessonPlans.id, id))
      .limit(1)

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

    return NextResponse.json(lessonPlan)
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
    const body = await request.json()
    const { title, code, content, date, generatedByAi } = body

    if (!content || !title) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
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

    // Update lesson plan
    const updateData: any = { content, title }
    if (date !== undefined) updateData.date = date
    if (code !== undefined) updateData.code = code || null
    if (generatedByAi !== undefined) updateData.generatedByAi = generatedByAi

    const [updated] = await db
      .update(lessonPlans)
      .set(updateData)
      .where(eq(lessonPlans.id, id))
      .returning()

    return NextResponse.json(updated)
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
