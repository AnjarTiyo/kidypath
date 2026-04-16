import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils/signature'
import { db } from '@/lib/db'
import { weeklyReports, students, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')

  if (!token) {
    return NextResponse.json({ valid: false, reason: 'Token verifikasi tidak ditemukan dalam URL.' }, { status: 400 })
  }

  const payload = verifyToken(decodeURIComponent(token))
  if (!payload) {
    return NextResponse.json(
      {
        valid: false,
        reason:
          'Tanda tangan digital tidak valid atau telah dimanipulasi. Dokumen tidak dapat diverifikasi.',
      },
      { status: 200 },
    )
  }

  const [report] = await db
    .select({ weekStart: weeklyReports.weekStart, weekEnd: weeklyReports.weekEnd, studentId: weeklyReports.studentId })
    .from(weeklyReports)
    .where(eq(weeklyReports.id, payload.rid))
    .limit(1)

  const [student] = report?.studentId
    ? await db
        .select({ fullName: students.fullName })
        .from(students)
        .where(eq(students.id, report.studentId!))
        .limit(1)
    : []

  const [teacher] = await db
    .select({ name: users.fullName })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1)

  return NextResponse.json({
    valid: true,
    teacherName: teacher?.name ?? null,
    studentName: student?.fullName ?? null,
    weekStart: report?.weekStart ?? null,
    weekEnd: report?.weekEnd ?? null,
    issuedAt: payload.iat,
    reportId: payload.rid,
    teacherId: payload.sub,
  })
}
