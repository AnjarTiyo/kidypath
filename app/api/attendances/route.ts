import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { attendances, students, classrooms } from "@/lib/db/schema"
import { desc, eq, and, sql } from "drizzle-orm"

// GET - List attendances with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const classroomId = searchParams.get("classroomId")
    const date = searchParams.get("date")
    const type = searchParams.get("type") // check_in or check_out
    const studentId = searchParams.get("studentId")

    // Build where conditions
    const conditions = []
    
    if (classroomId) {
      conditions.push(eq(attendances.classroomId, classroomId))
    }

    if (date) {
      conditions.push(eq(attendances.date, date))
    }

    if (type) {
      conditions.push(eq(attendances.type, type as 'check_in' | 'check_out'))
    }

    if (studentId) {
      conditions.push(eq(attendances.studentId, studentId))
    }

    // Get attendances with student info
    const data = await db
      .select({
        id: attendances.id,
        studentId: attendances.studentId,
        studentName: students.fullName,
        classroomId: attendances.classroomId,
        classroomName: classrooms.name,
        date: attendances.date,
        type: attendances.type,
        status: attendances.status,
        mood: attendances.mood,
        note: attendances.note,
        recordedBy: attendances.recordedBy,
        createdAt: attendances.createdAt,
      })
      .from(attendances)
      .leftJoin(students, eq(attendances.studentId, students.id))
      .leftJoin(classrooms, eq(attendances.classroomId, classrooms.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendances.createdAt))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching attendances:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new attendance record
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization (teacher or admin)
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, classroomId, date, type, status, mood, note } = body

    // Validation
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    if (!classroomId) {
      return NextResponse.json(
        { error: "Classroom ID is required" },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      )
    }

    if (!type || (type !== "check_in" && type !== "check_out")) {
      return NextResponse.json(
        { error: "Type must be check_in or check_out" },
        { status: 400 }
      )
    }

    if (!status || !["present", "sick", "permission"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be present, sick, or permission" },
        { status: 400 }
      )
    }

    // If status is present, mood is required
    if (status === "present" && !mood) {
      return NextResponse.json(
        { error: "Mood is required when status is present" },
        { status: 400 }
      )
    }

    // Validate mood if provided
    if (mood && !["bahagia", "sedih", "marah", "takut", "jijik"].includes(mood)) {
      return NextResponse.json(
        { error: "Invalid mood value" },
        { status: 400 }
      )
    }

    // Verify student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1)

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
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

    // Check if attendance already exists for this student, date, and type
    const [existing] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.studentId, studentId),
          eq(attendances.date, date),
          eq(attendances.type, type)
        )
      )
      .limit(1)

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(attendances)
        .set({
          status,
          mood: status === "present" ? mood : null,
          note: note || null,
          recordedBy: session.user.id,
        })
        .where(eq(attendances.id, existing.id))
        .returning()

      return NextResponse.json(updated)
    }

    // Create new attendance record
    const [newAttendance] = await db
      .insert(attendances)
      .values({
        studentId,
        classroomId,
        date,
        type,
        status,
        mood: status === "present" ? mood : null,
        note: note || null,
        recordedBy: session.user.id,
      })
      .returning()

    return NextResponse.json(newAttendance, { status: 201 })
  } catch (error) {
    console.error("Error creating attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
