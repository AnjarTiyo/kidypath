import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  attendances,
  assessmentItems,
  dailyAssessments,
  students,
  classroomTeachers,
  parentChild,
  developmentScopes,
  learningObjectives,
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const { role, id: userId } = session.user;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Access control
    if (role === 'teacher') {
      // Teacher must have the student in one of their classrooms
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
    } else if (role === 'parent') {
      // Parent must be linked to this student
      const link = await db
        .select({ id: parentChild.id })
        .from(parentChild)
        .where(
          and(eq(parentChild.parentId, userId), eq(parentChild.childId, studentId))
        )
        .limit(1);
      if (link.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (role !== 'admin' && !session.user.isCurriculumCoordinator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch student info
    const [studentInfo] = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        classroomId: students.classroomId,
        birthDate: students.birthDate,
        gender: students.gender,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!studentInfo) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Attendance for the period
    const attendanceRecords = await db
      .select({
        id: attendances.id,
        date: attendances.date,
        type: attendances.type,
        status: attendances.status,
        mood: attendances.mood,
        note: attendances.note,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.studentId, studentId),
          gte(attendances.date, startDate),
          lte(attendances.date, endDate)
        )
      );

    // Attendance stats
    const attendanceStats = { present: 0, sick: 0, permission: 0 };
    for (const rec of attendanceRecords) {
      if (rec.type === 'check_in') {
        if (rec.status === 'present') attendanceStats.present++;
        else if (rec.status === 'sick') attendanceStats.sick++;
        else if (rec.status === 'permission') attendanceStats.permission++;
      }
    }

    // Mood distribution
    const moodCount: Record<string, number> = {};
    for (const rec of attendanceRecords) {
      if (rec.type === 'check_in' && rec.mood) {
        moodCount[rec.mood] = (moodCount[rec.mood] ?? 0) + 1;
      }
    }

    // Assessment items — grouped by scope and objective
    const itemRows = await db
      .select({
        itemId: assessmentItems.id,
        date: dailyAssessments.date,
        scope: developmentScopes.name,
        scopeId: assessmentItems.scopeId,
        objectiveId: assessmentItems.objectiveId,
        objectiveDescription: learningObjectives.description,
        activityContext: assessmentItems.activityContext,
        score: assessmentItems.score,
        note: assessmentItems.note,
      })
      .from(assessmentItems)
      .innerJoin(
        dailyAssessments,
        eq(assessmentItems.dailyAssessmentId, dailyAssessments.id)
      )
      .leftJoin(
        learningObjectives,
        eq(assessmentItems.objectiveId, learningObjectives.id)
      )
      .leftJoin(
        developmentScopes,
        eq(assessmentItems.scopeId, developmentScopes.id)
      )
      .where(
        and(
          eq(dailyAssessments.studentId, studentId),
          gte(dailyAssessments.date, startDate),
          lte(dailyAssessments.date, endDate)
        )
      );

    // Group items by scope
    type ScopeGroup = {
      scope: string;
      objectives: {
        objectiveId: string | null;
        objectiveDescription: string | null;
        entries: { date: string | null; score: string | null; activityContext: string | null; note: string | null }[];
      }[];
      scoreSummary: Record<string, number>;
    };

    const scopeMap: Record<string, ScopeGroup> = {};
    for (const item of itemRows) {
      if (!item.scope) continue;
      if (!scopeMap[item.scope]) {
        scopeMap[item.scope] = { scope: item.scope, objectives: [], scoreSummary: { BB: 0, MB: 0, BSH: 0, BSB: 0 } };
      }
      // Track score summary
      if (item.score) {
        scopeMap[item.scope].scoreSummary[item.score] =
          (scopeMap[item.scope].scoreSummary[item.score] ?? 0) + 1;
      }
      // Group by objective
      const objKey = item.objectiveId ?? '__no_objective__';
      let objGroup = scopeMap[item.scope].objectives.find(
        (o) => (o.objectiveId ?? '__no_objective__') === objKey
      );
      if (!objGroup) {
        objGroup = {
          objectiveId: item.objectiveId ?? null,
          objectiveDescription: item.objectiveDescription ?? null,
          entries: [],
        };
        scopeMap[item.scope].objectives.push(objGroup);
      }
      objGroup.entries.push({
        date: item.date,
        score: item.score,
        activityContext: item.activityContext,
        note: item.note,
      });
    }

    return NextResponse.json({
      data: {
        student: studentInfo,
        attendanceStats,
        moodDistribution: moodCount,
        attendanceRecords,
        scopeBreakdown: Object.values(scopeMap),
      },
    });
  } catch (error) {
    console.error('Error fetching student report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
