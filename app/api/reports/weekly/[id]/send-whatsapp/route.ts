import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklyReports, students, classroomTeachers, parentChild, users } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import {
  KIRIMCHAT_ENDPOINT,
  buildWeeklyReportPayload,
  normalizePhoneNumber,
} from '@/lib/helpers/whatsapp'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { reportLink } = await request.json()

    if (!reportLink) {
      return NextResponse.json({ error: 'reportLink is required' }, { status: 400 })
    }

    const apiKey = process.env.KC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'WhatsApp service not configured' }, { status: 500 })
    }

    // Fetch existing report
    const [report] = await db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.id, id))
      .limit(1)

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (!report.studentId) {
      return NextResponse.json({ error: 'Report has no associated student' }, { status: 400 })
    }

    // Teachers can only send for students in their classrooms
    if (role === 'teacher') {
      const [student] = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, report.studentId))
        .limit(1)

      if (!student?.classroomId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const [assignment] = await db
        .select({ id: classroomTeachers.id })
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, student.classroomId),
            eq(classroomTeachers.teacherId, userId)
          )
        )
        .limit(1)

      if (!assignment) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Fetch the student's name
    const [student] = await db
      .select({ fullName: students.fullName })
      .from(students)
      .where(eq(students.id, report.studentId))
      .limit(1)

    const childName = student?.fullName ?? 'Siswa'

    // Fetch all parents with phone numbers mapped to this student
    const parents = await db
      .select({
        parentName: users.name,
        phoneNumber: users.phoneNumber,
      })
      .from(parentChild)
      .innerJoin(users, eq(parentChild.parentId, users.id))
      .where(
        and(
          eq(parentChild.childId, report.studentId),
          isNotNull(users.phoneNumber)
        )
      )

    if (parents.length === 0) {
      return NextResponse.json(
        { error: 'No parents with phone numbers found for this student' },
        { status: 400 }
      )
    }

    const startDate = report.weekStart ?? ''
    const endDate = report.weekEnd ?? ''

    const results = await Promise.allSettled(
      parents.map(async (parent) => {
        const normalized = normalizePhoneNumber(parent.phoneNumber!)
        const payload = buildWeeklyReportPayload({
          phoneNumber: normalized,
          parentName: parent.parentName ?? 'Orang Tua',
          childName,
          startDate,
          endDate,
          reportLink,
        })

        const res = await fetch(KIRIMCHAT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`kirim.chat error ${res.status}: ${errorText}`)
        }

        return { phone: normalized, parentName: parent.parentName }
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message ?? 'Unknown error')

    return NextResponse.json({ sent, total: parents.length, failed })
  } catch (error) {
    console.error('send-whatsapp error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
