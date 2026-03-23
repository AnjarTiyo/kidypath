import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  attendances,
  assessmentItems,
  dailyAssessments,
  developmentScopes,
  learningObjectives,
  students,
  classroomTeachers,
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql, isNotNull, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId, isCurriculumCoordinator } = session.user;
    if (role !== 'admin' && role !== 'teacher' && !isCurriculumCoordinator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const classroomId = params.get('classroomId');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');

    if (!classroomId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'classroomId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Teachers can only access their own classrooms
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

    // 1. Attendance aggregates — one row per student per status
    const attendanceRows = await db
      .select({
        studentId: attendances.studentId,
        studentName: students.fullName,
        status: attendances.status,
        count: sql<number>`count(*)::int`,
      })
      .from(attendances)
      .leftJoin(students, eq(attendances.studentId, students.id))
      .where(
        and(
          eq(attendances.classroomId, classroomId),
          gte(attendances.date, startDate),
          lte(attendances.date, endDate),
          eq(attendances.type, 'check_in') // count each school day once
        )
      )
      .groupBy(attendances.studentId, students.fullName, attendances.status);

    // Pivot attendance rows into per-student objects
    const attendanceMap: Record<
      string,
      { studentId: string; studentName: string | null; present: number; sick: number; permission: number }
    > = {};
    for (const row of attendanceRows) {
      if (!row.studentId) continue;
      if (!attendanceMap[row.studentId]) {
        attendanceMap[row.studentId] = {
          studentId: row.studentId,
          studentName: row.studentName ?? null,
          present: 0,
          sick: 0,
          permission: 0,
        };
      }
      if (row.status === 'present') attendanceMap[row.studentId].present = row.count;
      if (row.status === 'sick') attendanceMap[row.studentId].sick = row.count;
      if (row.status === 'permission') attendanceMap[row.studentId].permission = row.count;
    }

    // 2. Assessment score distribution per development_scope
    const scoreRows = await db
      .select({
        developmentScope: developmentScopes.name,
        score: assessmentItems.score,
        count: sql<number>`count(*)::int`,
      })
      .from(assessmentItems)
      .innerJoin(
        dailyAssessments,
        eq(assessmentItems.dailyAssessmentId, dailyAssessments.id)
      )
      .leftJoin(
        developmentScopes,
        eq(assessmentItems.scopeId, developmentScopes.id)
      )
      .where(
        and(
          eq(dailyAssessments.classroomId, classroomId),
          gte(dailyAssessments.date, startDate),
          lte(dailyAssessments.date, endDate)
        )
      )
      .groupBy(developmentScopes.name, assessmentItems.score);

    // Pivot score rows into { scope: { BB: n, MB: n, BSH: n, BSB: n } }
    type ScoreMap = { BB: number; MB: number; BSH: number; BSB: number; total: number };
    const scopeScores: Record<string, ScoreMap> = {};
    for (const row of scoreRows) {
      if (!row.developmentScope || !row.score) continue;
      if (!scopeScores[row.developmentScope]) {
        scopeScores[row.developmentScope] = { BB: 0, MB: 0, BSH: 0, BSB: 0, total: 0 };
      }
      scopeScores[row.developmentScope][row.score as keyof ScoreMap] = row.count;
      scopeScores[row.developmentScope].total += row.count;
    }

    // 3. Mood time series — per date, per attendance type (check_in / check_out)
    const moodRows = await db
      .select({
        date: attendances.date,
        type: attendances.type,
        mood: attendances.mood,
        count: sql<number>`count(*)::int`,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.classroomId, classroomId),
          gte(attendances.date, startDate),
          lte(attendances.date, endDate),
          isNotNull(attendances.mood)
        )
      )
      .groupBy(attendances.date, attendances.type, attendances.mood)
      .orderBy(attendances.date);

    // Build per-date dominant mood for check_in and check_out
    type MoodCounts = Record<string, number>;
    const moodByDate: Record<string, { check_in: MoodCounts; check_out: MoodCounts }> = {};
    for (const row of moodRows) {
      if (!row.date || !row.type || !row.mood) continue;
      if (!moodByDate[row.date]) moodByDate[row.date] = { check_in: {}, check_out: {} };
      moodByDate[row.date][row.type as 'check_in' | 'check_out'][row.mood] = row.count;
    }

    function dominantMood(counts: MoodCounts): string | null {
      const entries = Object.entries(counts);
      if (entries.length === 0) return null;
      return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    }

    const moodTimeSeries = Object.entries(moodByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, types]) => ({
        date,
        checkIn: dominantMood(types.check_in),
        checkOut: dominantMood(types.check_out),
      }));

    // 4. Assessment summaries
    const summaryRows = await db
      .select({
        id: dailyAssessments.id,
        studentId: dailyAssessments.studentId,
        studentName: students.fullName,
        date: dailyAssessments.date,
        summary: dailyAssessments.summary,
      })
      .from(dailyAssessments)
      .leftJoin(students, eq(dailyAssessments.studentId, students.id))
      .where(
        and(
          eq(dailyAssessments.classroomId, classroomId),
          gte(dailyAssessments.date, startDate),
          lte(dailyAssessments.date, endDate)
        )
      )
      .orderBy(dailyAssessments.date);

    const filteredSummaryRows = summaryRows.filter((r) => r.summary && r.summary.trim() !== '');
    const assessmentIds = filteredSummaryRows.map((r) => r.id).filter(Boolean) as string[];

    // 5. Assessment items for each summary
    const itemRows = assessmentIds.length > 0
      ? await db
          .select({
            dailyAssessmentId: assessmentItems.dailyAssessmentId,
            scopeName: developmentScopes.name,
            objectiveDescription: learningObjectives.description,
            activityContext: assessmentItems.activityContext,
            score: assessmentItems.score,
            note: assessmentItems.note,
          })
          .from(assessmentItems)
          .leftJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
          .leftJoin(learningObjectives, eq(assessmentItems.objectiveId, learningObjectives.id))
          .where(inArray(assessmentItems.dailyAssessmentId, assessmentIds))
      : [];

    const itemsByAssessment: Record<string, typeof itemRows[number][]> = {};
    for (const item of itemRows) {
      if (!item.dailyAssessmentId) continue;
      if (!itemsByAssessment[item.dailyAssessmentId]) itemsByAssessment[item.dailyAssessmentId] = [];
      itemsByAssessment[item.dailyAssessmentId].push(item);
    }

    const assessmentSummaries = filteredSummaryRows.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName ?? null,
      date: r.date,
      summary: r.summary as string,
      items: (itemsByAssessment[r.id!] ?? []).map((item) => ({
        scopeName: item.scopeName ?? null,
        activityContext: item.activityContext ?? null,
        score: item.score ?? null,
        note: item.note ?? null,
      })),
    }));

    return NextResponse.json({
      data: {
        attendanceSummary: Object.values(attendanceMap),
        scopeScores,
        moodTimeSeries,
        assessmentSummaries,
      },
    });
  } catch (error) {
    console.error('Error fetching class report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
