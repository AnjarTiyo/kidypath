import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { attendances, students, dailyAssessments, lessonPlans, classroomTeachers } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

/**
 * GET /api/daily-status
 * Fetches comprehensive daily status for a classroom on a specific date
 * 
 * Query params:
 * - classroomId: string (required)
 * - date: string (required, format: YYYY-MM-DD)
 * 
 * Returns:
 * - lessonPlan: { isCreated, topic, subtopic }
 * - checkIn: { isConducted, completedCount, totalStudents }
 * - assessment: { completedCount, totalStudents, progressPercentage }
 * - checkOut: { isConducted, completedCount, totalStudents }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const classroomId = searchParams.get("classroomId")
    const date = searchParams.get("date")

    console.log('=== DAILY STATUS API ===')
    console.log('User:', session.user.id, session.user.name, session.user.role)
    console.log('Requested classroomId:', classroomId)
    console.log('Requested date:', date)

    if (!classroomId || !date) {
      return NextResponse.json(
        { error: "classroomId and date are required" },
        { status: 400 }
      )
    }

    // Authorization check for teachers - verify they are assigned to this classroom
    if (session.user.role === "teacher") {
      const [teacherAssignment] = await db
        .select()
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, classroomId),
            eq(classroomTeachers.teacherId, session.user.id)
          )
        )
        .limit(1)

      if (!teacherAssignment) {
        console.error('AUTHORIZATION FAILED: Teacher not assigned to classroom')
        console.error('Teacher ID:', session.user.id)
        console.error('Classroom ID:', classroomId)
        return NextResponse.json(
          { error: "You are not assigned to this classroom" },
          { status: 403 }
        )
      }
      console.log('Authorization OK: Teacher is assigned to this classroom')
    }

    // Get total students in classroom
    const classroomStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classroomId, classroomId))

    const totalStudents = classroomStudents.length
    console.log('Total students in classroom:', totalStudents)

    // Get lesson plan status
    const lessonPlanData = await db
      .select({
        id: lessonPlans.id,
        topic: lessonPlans.topic,
        subtopic: lessonPlans.subtopic,
      })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.classroomId, classroomId),
          eq(lessonPlans.date, date)
        )
      )
      .limit(1)

    const lessonPlanStatus = {
      isCreated: lessonPlanData.length > 0,
      topic: lessonPlanData[0]?.topic,
      subtopic: lessonPlanData[0]?.subtopic,
    }

    // Get check-in status
    const checkInData = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.classroomId, classroomId),
          eq(attendances.date, date),
          eq(attendances.type, 'check_in')
        )
      )

    const checkInCount = Number(checkInData[0]?.count || 0)
    const checkInStatus = {
      isConducted: checkInCount === totalStudents && totalStudents > 0,
      completedCount: checkInCount,
      totalStudents,
    }

    // Get check-out status
    const checkOutData = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.classroomId, classroomId),
          eq(attendances.date, date),
          eq(attendances.type, 'check_out')
        )
      )

    const checkOutCount = Number(checkOutData[0]?.count || 0)
    const checkOutStatus = {
      isConducted: checkOutCount === totalStudents && totalStudents > 0,
      completedCount: checkOutCount,
      totalStudents,
    }

    // Get assessment status
    const assessmentData = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(dailyAssessments)
      .where(
        and(
          eq(dailyAssessments.classroomId, classroomId),
          eq(dailyAssessments.date, date)
        )
      )

    const assessmentCount = Number(assessmentData[0]?.count || 0)
    const progressPercentage = totalStudents > 0 
      ? Math.round((assessmentCount / totalStudents) * 100)
      : 0

    const assessmentStatus = {
      completedCount: assessmentCount,
      totalStudents,
      progressPercentage,
    }

    const result = {
      classroomId,
      date,
      lessonPlan: lessonPlanStatus,
      checkIn: checkInStatus,
      assessment: assessmentStatus,
      checkOut: checkOutStatus,
    }

    console.log('Returning daily status:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching daily status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
