import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  users,
  classrooms,
  classroomTeachers,
  students,
  parentChild,
  lessonPlans,
  attendances,
  semesterTopics,
  monthlyTopics,
  weeklyTopics,
} from "@/lib/db/schema"
import { eq, and, count, gte, lte, ne, inArray } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        displayName: users.displayName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isCurriculumCoordinator: users.isCurriculumCoordinator,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let stats: Record<string, unknown> = {}

    if (user.role === "teacher") {
      // Classrooms assigned to this teacher
      const teacherClassrooms = await db
        .select({
          id: classrooms.id,
          name: classrooms.name,
          academicYear: classrooms.academicYear,
        })
        .from(classroomTeachers)
        .innerJoin(classrooms, eq(classroomTeachers.classroomId, classrooms.id))
        .where(eq(classroomTeachers.teacherId, userId))

      const classroomIds = teacherClassrooms.map((c) => c.id)

      // Student count across those classrooms
      let studentCount = 0
      if (classroomIds.length > 0) {
        const [studentCountRow] = await db
          .select({ count: count() })
          .from(students)
          .where(inArray(students.classroomId, classroomIds))
        studentCount = Number(studentCountRow?.count ?? 0)
      }

      // Lesson plans created by this teacher
      const [lessonPlanCountRow] = await db
        .select({ count: count() })
        .from(lessonPlans)
        .where(eq(lessonPlans.createdBy, userId))
      const lessonPlanCount = Number(lessonPlanCountRow?.count ?? 0)

      // Attendance records created by this teacher in the current month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10)

      const [attendanceCountRow] = await db
        .select({ count: count() })
        .from(attendances)
        .where(
          and(
            eq(attendances.recordedBy, userId),
            gte(attendances.date, monthStart),
            lte(attendances.date, monthEnd)
          )
        )
      const attendanceCount = Number(attendanceCountRow?.count ?? 0)

      stats = {
        classrooms: teacherClassrooms,
        classroomCount: teacherClassrooms.length,
        studentCount,
        lessonPlanCount,
        attendanceThisMonth: attendanceCount,
      }
    } else if (user.role === "admin") {
      const [userCountRow] = await db.select({ count: count() }).from(users)
      const [classroomCountRow] = await db.select({ count: count() }).from(classrooms)

      stats = {
        userCount: Number(userCountRow?.count ?? 0),
        classroomCount: Number(classroomCountRow?.count ?? 0),
      }
    } else if (user.role === "parent") {
      const children = await db
        .select({
          id: students.id,
          fullName: students.fullName,
          displayName: students.displayName,
          avatarUrl: students.avatarUrl,
          classroomId: students.classroomId,
          birthDate: students.birthDate,
          gender: students.gender,
        })
        .from(parentChild)
        .innerJoin(students, eq(parentChild.childId, students.id))
        .where(eq(parentChild.parentId, userId))

      // Latest attendance record per child
      const childrenWithAttendance = await Promise.all(
        children.map(async (child) => {
          const [latestAttendance] = await db
            .select({
              date: attendances.date,
              status: attendances.status,
            })
            .from(attendances)
            .where(eq(attendances.studentId, child.id))
            .orderBy(attendances.date)
            .limit(1)

          return {
            ...child,
            latestAttendance: latestAttendance ?? null,
          }
        })
      )

      stats = {
        children: childrenWithAttendance,
        childrenCount: children.length,
      }
    } else if (user.role === "curriculum") {
      const [semesterCountRow] = await db
        .select({ count: count() })
        .from(semesterTopics)
        .where(eq(semesterTopics.createdBy, userId))

      const [monthlyCountRow] = await db
        .select({ count: count() })
        .from(monthlyTopics)
        .where(eq(monthlyTopics.createdBy, userId))

      const [weeklyCountRow] = await db
        .select({ count: count() })
        .from(weeklyTopics)
        .where(eq(weeklyTopics.createdBy, userId))

      stats = {
        semesterTopicCount: Number(semesterCountRow?.count ?? 0),
        monthlyTopicCount: Number(monthlyCountRow?.count ?? 0),
        weeklyTopicCount: Number(weeklyCountRow?.count ?? 0),
      }
    }

    return NextResponse.json({ user, stats })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { fullName, displayName, email, phoneNumber } = body

    // Validate email uniqueness if being changed
    if (email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, userId)))
        .limit(1)

      if (existing) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh pengguna lain" },
          { status: 400 }
        )
      }
    }

    const updateData: {
      updatedAt: Date
      fullName?: string | null
      displayName?: string | null
      email?: string
      phoneNumber?: string | null
    } = {
      updatedAt: new Date(),
    }

    if (fullName !== undefined) updateData.fullName = fullName || null
    if (displayName !== undefined) updateData.displayName = displayName || null
    if (email) updateData.email = email
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        fullName: users.fullName,
        displayName: users.displayName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
