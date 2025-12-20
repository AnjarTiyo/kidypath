import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { dailyAssessments, students, developmentScopes, learningObjectives } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get('classroomId');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');

    if (!classroomId || !date) {
      return NextResponse.json(
        { error: 'classroomId and date are required' },
        { status: 400 }
      );
    }

    // Get all students in the classroom
    const classroomStudents = await db
      .select()
      .from(students)
      .where(eq(students.classroomId, classroomId));

    // Get assessments for the date
    let assessmentsQuery = db
      .select({
        id: dailyAssessments.id,
        studentId: dailyAssessments.studentId,
        studentName: students.fullName,
        scopeId: dailyAssessments.scopeId,
        scopeName: developmentScopes.name,
        objectiveId: dailyAssessments.objectiveId,
        objectiveDescription: learningObjectives.description,
        activityContext: dailyAssessments.activityContext,
        score: dailyAssessments.score,
        note: dailyAssessments.note,
        date: dailyAssessments.date,
        createdAt: dailyAssessments.createdAt,
      })
      .from(dailyAssessments)
      .leftJoin(students, eq(dailyAssessments.studentId, students.id))
      .leftJoin(developmentScopes, eq(dailyAssessments.scopeId, developmentScopes.id))
      .leftJoin(learningObjectives, eq(dailyAssessments.objectiveId, learningObjectives.id))
      .where(
        and(
          eq(dailyAssessments.date, date),
          studentId ? eq(dailyAssessments.studentId, studentId) : undefined
        )
      )
      .orderBy(desc(dailyAssessments.createdAt));

    const assessmentsData = await assessmentsQuery;

    // Filter assessments to only include students from this classroom
    const studentIds = new Set(classroomStudents.map(s => s.id));
    const filteredAssessments = assessmentsData.filter(a => a.studentId && studentIds.has(a.studentId));

    return NextResponse.json({
      data: filteredAssessments,
      total: filteredAssessments.length,
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      date,
      scopeId,
      objectiveId,
      activityContext,
      score,
      note,
    } = body;

    // Validate required fields
    if (!studentId || !date || !scopeId || !objectiveId || !activityContext || !score) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if assessment already exists for this student, date, and scope
    const existing = await db
      .select()
      .from(dailyAssessments)
      .where(
        and(
          eq(dailyAssessments.studentId, studentId),
          eq(dailyAssessments.date, date),
          eq(dailyAssessments.scopeId, scopeId)
        )
      )
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Update existing assessment
      result = await db
        .update(dailyAssessments)
        .set({
          objectiveId,
          activityContext,
          score,
          note: note || null,
        })
        .where(eq(dailyAssessments.id, existing[0].id))
        .returning();
    } else {
      // Create new assessment
      result = await db
        .insert(dailyAssessments)
        .values({
          studentId,
          date,
          teacherId: session.user.id,
          scopeId,
          objectiveId,
          activityContext,
          score,
          note: note || null,
        })
        .returning();
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error creating/updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}
