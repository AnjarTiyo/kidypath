import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, classrooms, classroomTeachers, students, parentChild } from "@/lib/db/schema"
import { eq, is } from "drizzle-orm"

export async function GET(request: Request) {
  // Force no-cache headers
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }

  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
    }

    // Get user details
    const [user] = await db
      .select({
        id: users.id,
        name: users.fullName,
        email: users.email,
        role: users.role,
        isCurriculumCoordinator: users.isCurriculumCoordinator,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers })
    }

    let relatedData = {}

    // If teacher, get their classrooms
    if (user.role === "teacher") {
      const teacherClassrooms = await db
        .select({
          id: classrooms.id,
          name: classrooms.name,
          academicYear: classrooms.academicYear,
          createdAt: classrooms.createdAt,
        })
        .from(classroomTeachers)
        .innerJoin(classrooms, eq(classroomTeachers.classroomId, classrooms.id))
        .where(eq(classroomTeachers.teacherId, user.id))

      relatedData = {
        classrooms: teacherClassrooms,
      }
    }

    // If parent, get their children
    if (user.role === "parent") {
      const children = await db
        .select({
          id: students.id,
          fullName: students.fullName,
          classroomId: students.classroomId,
          birthDate: students.birthDate,
          gender: students.gender,
        })
        .from(parentChild)
        .innerJoin(students, eq(parentChild.childId, students.id))
        .where(eq(parentChild.parentId, user.id))

      relatedData = {
        children,
      }
    }

    return NextResponse.json(
      {
        user,
        ...relatedData,
      },
      { headers }
    )
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
