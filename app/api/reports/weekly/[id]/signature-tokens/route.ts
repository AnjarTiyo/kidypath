import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import {
  weeklyReports,
  students,
  classroomTeachers,
  users,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signToken } from '@/lib/utils/signature'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch the report
    const [report] = await db
      .select({ weekStart: weeklyReports.weekStart, weekEnd: weeklyReports.weekEnd, studentId: weeklyReports.studentId })
      .from(weeklyReports)
      .where(eq(weeklyReports.id, id))
      .limit(1)

    if (!report) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch student + classroom
    const [student] = report.studentId
      ? await db
          .select({ fullName: students.fullName, classroomId: students.classroomId })
          .from(students)
          .where(eq(students.id, report.studentId))
          .limit(1)
      : []

    const classroomId = student?.classroomId ?? null

    // Fetch teachers assigned to this classroom
    const teachersData = classroomId
      ? await db
          .select({ id: users.id, name: users.name })
          .from(classroomTeachers)
          .innerJoin(users, eq(classroomTeachers.teacherId, users.id))
          .where(eq(classroomTeachers.classroomId, classroomId))
      : []

    // Build the public base URL for verify links
    const origin = req.nextUrl.origin

    const issuedAt = Math.floor(Date.now() / 1000)

    // Generate a signed verify URL per teacher
    const tokens: Record<string, string> = {}
    for (const teacher of teachersData) {
      const token = signToken({ sub: teacher.id, rid: id, iat: issuedAt })
      tokens[teacher.id] = `${origin}/verify?t=${encodeURIComponent(token)}`
    }

    return NextResponse.json({ data: tokens })
  } catch (error) {
    console.error('Error generating signature tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
