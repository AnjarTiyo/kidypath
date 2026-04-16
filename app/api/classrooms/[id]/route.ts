import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { classrooms, users, classroomTeachers } from "@/lib/db/schema"
import { eq, sql, inArray } from "drizzle-orm"

// GET - Get single classroom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [classroom] = await db
      .select({
        id: classrooms.id,
        name: classrooms.name,
        academicYear: classrooms.academicYear,
        createdAt: classrooms.createdAt,
      })
      .from(classrooms)
      .where(eq(classrooms.id, id))
      .limit(1)

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
    }

    // Fetch teachers for this classroom
    const teachersData = await db
      .select({
        teacherId: users.id,
        teacherName: users.fullName,
      })
      .from(classroomTeachers)
      .innerJoin(users, eq(classroomTeachers.teacherId, users.id))
      .where(eq(classroomTeachers.classroomId, id))

    const teachers = teachersData.map(t => ({ id: t.teacherId, name: t.teacherName }))

    return NextResponse.json({
      ...classroom,
      teachers,
      teacherIds: teachers.map(t => t.id),
    })
  } catch (error) {
    console.error("Error fetching classroom:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update classroom
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, academicYear, teacherIds } = body

    // Validation
    if (!name || !academicYear) {
      return NextResponse.json(
        { error: "Name and academic year are required" },
        { status: 400 }
      )
    }

    // Check if classroom exists
    const [existing] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
    }

    // Check for duplicates (excluding current classroom)
    const [duplicate] = await db
      .select()
      .from(classrooms)
      .where(
        sql`${classrooms.name} = ${name} AND ${classrooms.academicYear} = ${academicYear} AND ${classrooms.id} != ${id}`
      )
      .limit(1)

    if (duplicate) {
      return NextResponse.json(
        { error: "Classroom with this name and academic year already exists" },
        { status: 400 }
      )
    }

    // Verify teachers exist if provided
    if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
      const teachers = await db
        .select()
        .from(users)
        .where(inArray(users.id, teacherIds))

      if (teachers.length !== teacherIds.length) {
        return NextResponse.json(
          { error: "One or more teachers not found" },
          { status: 400 }
        )
      }

      const nonTeachers = teachers.filter(t => t.role !== "teacher")
      if (nonTeachers.length > 0) {
        return NextResponse.json(
          { error: "One or more selected users are not teachers" },
          { status: 400 }
        )
      }
    }

    // Update classroom
    const [updatedClassroom] = await db
      .update(classrooms)
      .set({
        name,
        academicYear,
      })
      .where(eq(classrooms.id, id))
      .returning()

    // Update teachers - delete existing and insert new ones
    await db
      .delete(classroomTeachers)
      .where(eq(classroomTeachers.classroomId, id))

    if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
      await db
        .insert(classroomTeachers)
        .values(
          teacherIds.map(teacherId => ({
            classroomId: id,
            teacherId,
          }))
        )
    }

    return NextResponse.json(updatedClassroom)
  } catch (error) {
    console.error("Error updating classroom:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if classroom exists
    const [existing] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
    }

    // Delete classroom
    await db
      .delete(classrooms)
      .where(eq(classrooms.id, id))

    return NextResponse.json({ message: "Classroom deleted successfully" })
  } catch (error) {
    console.error("Error deleting classroom:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
