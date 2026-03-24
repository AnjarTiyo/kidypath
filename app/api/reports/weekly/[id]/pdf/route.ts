import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklyReports, students, classroomTeachers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { uploadFile, urlToKey, deleteFile } from '@/lib/storage'

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

    const { id: reportId } = await params

    // Fetch report and verify access
    const [existing] = await db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.id, reportId))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (role === 'teacher' && existing.studentId) {
      const [student] = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, existing.studentId))
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

    // Receive PDF from FormData
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await (file as File).arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Delete old PDF if it exists
    if (existing.pdfUrl) {
      const oldKey = urlToKey(existing.pdfUrl)
      if (oldKey) {
        await deleteFile(oldKey).catch(() => { /* best-effort */ })
      }
    }

    const key = `reports/${reportId}.pdf`
    const pdfUrl = await uploadFile(buffer, key, 'application/pdf')

    const [updated] = await db
      .update(weeklyReports)
      .set({ pdfUrl })
      .where(eq(weeklyReports.id, reportId))
      .returning()

    return NextResponse.json({ success: true, pdfUrl: updated.pdfUrl })
  } catch (error) {
    console.error('Error uploading report PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
