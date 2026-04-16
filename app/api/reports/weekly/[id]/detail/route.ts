import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import {
  weeklyReports,
  students,
  classroomTeachers,
  users,
  parentChild,
  attendances,
  dailyAssessments,
  assessmentItems,
  developmentScopes,
  learningObjectives,
  semesterTopics,
  monthlyTopics,
  weeklyTopics,
} from '@/lib/db/schema'
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm'
import {
  getAcademicYearFromDate,
  getSemesterNumberFromDate,
  getMonthNumberFromDate,
  getWeekOfMonth,
  getMonthName,
} from '@/lib/helpers/topic-helpers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, id: userId } = session.user
    const { id } = await params

    // Fetch the report
    const [report] = await db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.id, id))
      .limit(1)

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Access control
    if (role === 'teacher') {
      if (!report.studentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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
    } else if (role === 'parent') {
      if (!report.studentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const [link] = await db
        .select({ id: parentChild.id })
        .from(parentChild)
        .where(and(eq(parentChild.parentId, userId), eq(parentChild.childId, report.studentId)))
        .limit(1)
      if (!link || !report.isPublished) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch student
    const [student] = report.studentId
      ? await db
          .select()
          .from(students)
          .where(eq(students.id, report.studentId))
          .limit(1)
      : []

    const weekStart = report.weekStart ?? ''
    const weekEnd = report.weekEnd ?? ''

    // ── Topics: derive from weekStart date ───────────────────────────────────
    let topicsPayload: {
      semester: { title: string; academicYear: string | null; semesterNumber: number | null } | null
      monthly: { title: string; monthNumber: number | null } | null
      weekly: { title: string; weekNumber: number | null } | null
    } | null = null

    if (weekStart) {
      const weekStartDate = new Date(weekStart)
      const academicYear = getAcademicYearFromDate(weekStartDate)
      const semesterNumber = getSemesterNumberFromDate(weekStartDate)
      const monthNumber = getMonthNumberFromDate(weekStartDate)
      const weekNumber = getWeekOfMonth(weekStartDate)

      const semesterRow = await db.query.semesterTopics.findFirst({
        where: (t, { eq: eqFn, and: andFn }) =>
          andFn(eqFn(t.academicYear, academicYear), eqFn(t.semesterNumber, semesterNumber)),
        with: {
          monthlyTopics: {
            where: (m, { eq: eqFn }) => eqFn(m.monthNumber, monthNumber),
            with: {
              weeklyTopics: {
                where: (w, { eq: eqFn }) => eqFn(w.weekNumber, weekNumber),
              },
            },
          },
        },
      })

      if (semesterRow) {
        const monthlyRow = semesterRow.monthlyTopics[0] ?? null
        const weeklyRow = monthlyRow?.weeklyTopics[0] ?? null
        topicsPayload = {
          semester: {
            title: semesterRow.title,
            academicYear: semesterRow.academicYear,
            semesterNumber: semesterRow.semesterNumber,
          },
          monthly: monthlyRow
            ? {
                title: monthlyRow.title,
                monthNumber: monthlyRow.monthNumber,
              }
            : null,
          weekly: weeklyRow
            ? { title: weeklyRow.title, weekNumber: weeklyRow.weekNumber }
            : null,
        }
      }
    }

    // ── Attendance ───────────────────────────────────────────────────────────
    const allAttendance =
      report.studentId && weekStart && weekEnd
        ? await db
            .select({
              date: attendances.date,
              type: attendances.type,
              status: attendances.status,
              mood: attendances.mood,
            })
            .from(attendances)
            .where(
              and(
                eq(attendances.studentId, report.studentId),
                gte(attendances.date, weekStart),
                lte(attendances.date, weekEnd)
              )
            )
        : []

    // Group by date
    const attendanceMap: Record<
      string,
      {
        checkIn: { status: string | null; mood: string | null } | null
        checkOut: { status: string | null; mood: string | null } | null
      }
    > = {}
    for (const a of allAttendance) {
      const d = a.date ?? ''
      if (!attendanceMap[d]) attendanceMap[d] = { checkIn: null, checkOut: null }
      if (a.type === 'check_in') {
        attendanceMap[d].checkIn = { status: a.status, mood: a.mood }
      } else {
        attendanceMap[d].checkOut = { status: a.status, mood: a.mood }
      }
    }
    const attendanceByDate = Object.entries(attendanceMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }))

    // ── Mood time series ─────────────────────────────────────────────────────
    const moodTimeSeries = attendanceByDate.map((row) => ({
      date: row.date,
      checkIn: row.checkIn?.mood ?? null,
      checkOut: row.checkOut?.mood ?? null,
    }))

    // ── Assessment items ─────────────────────────────────────────────────────
    const rawItems =
      report.studentId && weekStart && weekEnd
        ? await db
            .select({
              date: dailyAssessments.date,
              scope: developmentScopes.name,
              objectiveId: learningObjectives.id,
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
            .innerJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
            .leftJoin(learningObjectives, eq(assessmentItems.objectiveId, learningObjectives.id))
            .where(
              and(
                eq(dailyAssessments.studentId, report.studentId),
                gte(dailyAssessments.date, weekStart),
                lte(dailyAssessments.date, weekEnd)
              )
            )
        : []

    // scopeScores
    const scopeScores: Record<string, { BB: number; MB: number; BSH: number; BSB: number; total: number }> =
      {}
    for (const item of rawItems) {
      const s = item.scope ?? 'unknown'
      if (!scopeScores[s]) scopeScores[s] = { BB: 0, MB: 0, BSH: 0, BSB: 0, total: 0 }
      const sc = item.score ?? ''
      if (sc === 'BB' || sc === 'MB' || sc === 'BSH' || sc === 'BSB') {
        scopeScores[s][sc]++
        scopeScores[s].total++
      }
    }

    // scopeBreakdown
    const scopeMap: Record<
      string,
      Record<
        string,
        {
          objectiveId: string | null
          objectiveDescription: string | null
          entries: { date: string | null; activityContext: string | null; score: string | null; note: string | null }[]
        }
      >
    > = {}
    for (const item of rawItems) {
      const s = item.scope ?? 'unknown'
      const oId = item.objectiveId ?? '__none__'
      if (!scopeMap[s]) scopeMap[s] = {}
      if (!scopeMap[s][oId]) {
        scopeMap[s][oId] = {
          objectiveId: item.objectiveId,
          objectiveDescription: item.objectiveDescription,
          entries: [],
        }
      }
      scopeMap[s][oId].entries.push({
        date: item.date,
        activityContext: item.activityContext,
        score: item.score,
        note: item.note,
      })
    }
    const scopeBreakdown = Object.entries(scopeMap).map(([scope, objMap]) => ({
      scope,
      objectives: Object.values(objMap),
    }))

    // ── Activity images ──────────────────────────────────────────────────────
    const activityImages =
      report.studentId && weekStart && weekEnd
        ? await db
            .select({
              date: dailyAssessments.date,
              imageUrl: dailyAssessments.imageUrl,
            })
            .from(dailyAssessments)
            .where(
              and(
                eq(dailyAssessments.studentId, report.studentId),
                gte(dailyAssessments.date, weekStart),
                lte(dailyAssessments.date, weekEnd),
                isNotNull(dailyAssessments.imageUrl)
              )
            )
        : []

    // ── Teachers for the classroom ───────────────────────────────────────────
    const classroomId = student?.classroomId ?? null
    const teachersData = classroomId
      ? await db
          .select({
            id: users.id,
            name: users.fullName,
          })
          .from(classroomTeachers)
          .innerJoin(users, eq(classroomTeachers.teacherId, users.id))
          .where(eq(classroomTeachers.classroomId, classroomId))
      : []
    const teachers = teachersData.map((t) => ({ id: t.id, name: t.name }))

    return NextResponse.json({
      data: {
        report,
        student: student ?? null,
        topics: topicsPayload,
        attendanceByDate,
        scopeScores,
        moodTimeSeries,
        scopeBreakdown,
        activityImages,
        teachers,
      },
    })
  } catch (error) {
    console.error('Error fetching weekly report detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
