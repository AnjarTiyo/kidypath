import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyReports, students, parentChild, classroomTeachers } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const params = request.nextUrl.searchParams;
    const studentId = params.get('studentId');
    const classroomId = params.get('classroomId');

    if (!studentId && !classroomId) {
      return NextResponse.json({ error: 'studentId or classroomId is required' }, { status: 400 });
    }

    // ── classroomId path (teacher/admin list view) ────────────────────────────
    if (classroomId) {
      if (role !== 'teacher' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (role === 'teacher') {
        const assignment = await db
          .select({ id: classroomTeachers.id })
          .from(classroomTeachers)
          .where(
            and(
              eq(classroomTeachers.classroomId, classroomId),
              eq(classroomTeachers.teacherId, userId)
            )
          )
          .limit(1);
        if (assignment.length === 0) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      // Fetch all students in the classroom
      const classroomStudents = await db
        .select({ id: students.id, fullName: students.fullName })
        .from(students)
        .where(eq(students.classroomId, classroomId));

      if (classroomStudents.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const studentIds = classroomStudents.map((s) => s.id);
      const nameMap = Object.fromEntries(classroomStudents.map((s) => [s.id, s.fullName]));

      const reports = await db
        .select()
        .from(weeklyReports)
        .where(inArray(weeklyReports.studentId, studentIds))
        .orderBy(desc(weeklyReports.weekStart));

      const enriched = reports.map((r) => ({
        ...r,
        studentName: r.studentId ? (nameMap[r.studentId] ?? null) : null,
      }));

      return NextResponse.json({ data: enriched });
    }

    // ── studentId path (legacy / parent view) ────────────────────────────────
    if (role === 'teacher') {
      const student = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, studentId!))
        .limit(1);
      if (!student[0]?.classroomId) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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
    } else if (role === 'parent') {
      const link = await db
        .select({ id: parentChild.id })
        .from(parentChild)
        .where(and(eq(parentChild.parentId, userId), eq(parentChild.childId, studentId!)))
        .limit(1);
      if (link.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conditions = [eq(weeklyReports.studentId, studentId!)];
    if (role === 'parent') {
      conditions.push(eq(weeklyReports.isPublished, true));
    }

    const reports = await db
      .select()
      .from(weeklyReports)
      .where(and(...conditions))
      .orderBy(desc(weeklyReports.weekStart));

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, weekStart, weekEnd, summaryText } = body;

    if (!studentId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'studentId, weekStart, and weekEnd are required' },
        { status: 400 }
      );
    }

    // Teachers can only create reports for students in their classrooms
    if (role === 'teacher') {
      const student = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);
      if (!student[0]?.classroomId) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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

    // Idempotent: return existing report if one already exists for this student + week
    const [existing] = await db
      .select()
      .from(weeklyReports)
      .where(
        and(
          eq(weeklyReports.studentId, studentId),
          eq(weeklyReports.weekStart, weekStart),
          eq(weeklyReports.weekEnd, weekEnd)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ success: true, data: existing, existingId: existing.id }, { status: 200 });
    }

    const [created] = await db
      .insert(weeklyReports)
      .values({
        studentId,
        weekStart,
        weekEnd,
        summaryText: summaryText ?? null,
        autoGenerated: false,
        isPublished: false,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
