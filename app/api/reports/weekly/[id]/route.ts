import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyReports, students, classroomTeachers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { summaryText, isPublished } = body;

    // Fetch existing report to verify access
    const [existing] = await db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Teachers can only update reports for students in their classrooms
    if (role === 'teacher' && existing.studentId) {
      const student = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, existing.studentId))
        .limit(1);
      if (!student[0]?.classroomId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const assignment = await db
        .select({ id: classroomTeachers.id })
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, student[0].classroomId),
            eq(classroomTeachers.teacherId, userId)
          )
        )
        .limit(1);
      if (assignment.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updateData: Partial<{ summaryText: string | null; isPublished: boolean }> = {};
    if (summaryText !== undefined) updateData.summaryText = summaryText;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const [updated] = await db
      .update(weeklyReports)
      .set(updateData)
      .where(eq(weeklyReports.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating weekly report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Teachers can only delete reports for students in their classrooms
    if (role === 'teacher' && existing.studentId) {
      const student = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, existing.studentId))
        .limit(1);
      if (!student[0]?.classroomId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const assignment = await db
        .select({ id: classroomTeachers.id })
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, student[0].classroomId),
            eq(classroomTeachers.teacherId, userId)
          )
        )
        .limit(1);
      if (assignment.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await db.delete(weeklyReports).where(eq(weeklyReports.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weekly report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
