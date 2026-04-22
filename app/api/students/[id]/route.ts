import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { students, classrooms, users, parentChild } from "@/lib/db/schema"
import { eq, sql, inArray, and } from "drizzle-orm"

// GET - Get single student
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

    // Get student with classroom info
    const [student] = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        birthDate: students.birthDate,
        gender: students.gender,
        classroomId: students.classroomId,
        classroomName: classrooms.name,
        createdAt: students.createdAt,
      })
      .from(students)
      .leftJoin(classrooms, eq(students.classroomId, classrooms.id))
      .where(eq(students.id, id))
      .limit(1)

    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    // Get parents
    const parentsData = await db
      .select({
        parentId: users.id,
        parentName: users.fullName,
        parentEmail: users.email,
      })
      .from(parentChild)
      .innerJoin(users, eq(parentChild.parentId, users.id))
      .where(eq(parentChild.childId, id))

    const studentWithParents = {
      ...student,
      parents: parentsData.map(p => ({
        id: p.parentId,
        name: p.parentName,
        email: p.parentEmail,
      })),
    }

    return NextResponse.json(studentWithParents)
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update student
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

    // Check authorization (admin or teacher)
    if (session.user.role !== "admin" && session.user.role !== "teacher" && !session.user.isCurriculumCoordinator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, birthDate, gender, classroomId, parentIds } = body

    // Check if student exists
    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!existingStudent) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    // Validation
    if (fullName !== undefined && !fullName) {
      return NextResponse.json(
        { error: "Nama lengkap harus diisi" },
        { status: 400 }
      )
    }

    if (gender !== undefined && gender !== "male" && gender !== "female") {
      return NextResponse.json(
        { error: "Jenis kelamin tidak valid" },
        { status: 400 }
      )
    }

    // Verify classroom exists if provided
    if (classroomId && classroomId !== null) {
      const [classroom] = await db
        .select()
        .from(classrooms)
        .where(eq(classrooms.id, classroomId))
        .limit(1)

      if (!classroom) {
        return NextResponse.json(
          { error: "Kelas tidak ditemukan" },
          { status: 404 }
        )
      }
    }

    // Verify parents exist if provided
    if (parentIds && parentIds.length > 0) {
      const parents = await db
        .select()
        .from(users)
        .where(
          and(
            inArray(users.id, parentIds),
            eq(users.role, 'parent')
          )
        )

      if (parents.length !== parentIds.length) {
        return NextResponse.json(
          { error: "Beberapa orang tua tidak ditemukan atau bukan role parent" },
          { status: 404 }
        )
      }
    }

    // Build update object
    const updateData: Partial<typeof students.$inferInsert> = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (birthDate !== undefined) updateData.birthDate = birthDate || null
    if (gender !== undefined) updateData.gender = gender
    if (classroomId !== undefined) updateData.classroomId = classroomId || null

    // Update student
    const [updatedStudent] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning()

    // Update parents if provided
    if (parentIds !== undefined) {
      // Delete existing parent-child relationships
      await db
        .delete(parentChild)
        .where(eq(parentChild.childId, id))

      // Add new relationships
      if (parentIds.length > 0) {
        await db
          .insert(parentChild)
          .values(
            parentIds.map((parentId: string) => ({
              parentId,
              childId: id,
            }))
          )
      }
    }

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete student
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

    // Check authorization (admin only)
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if student exists
    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!existingStudent) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    // Delete student (parent-child relationships will cascade delete)
    await db
      .delete(students)
      .where(eq(students.id, id))

    return NextResponse.json({ message: "Siswa berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
