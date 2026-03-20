import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { dailyAssessments, assessmentItems, students, developmentScopes, learningObjectives } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface AssessmentItemRecord {
  id: string;
  dailyAssessmentId: string | null;
  scopeId: string | null;
  scopeName: string | null;
  objectiveId: string | null;
  objectiveDescription: string | null;
  activityContext: string | null;
  score: string | null;
  note: string | null;
  createdAt: Date | null;
}

type AssessmentScore = 'BB' | 'MB' | 'BSH' | 'BSB';

interface AssessmentRequestItem {
  scopeId: string;
  objectiveId: string;
  activityContext: string;
  score: AssessmentScore;
  note?: string | null;
}

interface AssessmentRequestBody {
  studentId: string;
  classroomId: string;
  date: string;
  summary?: string | null;
  items: AssessmentRequestItem[];
}

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

    // Get daily assessments (summary) for the date
    const dailyAssessmentsData = await db
      .select({
        id: dailyAssessments.id,
        studentId: dailyAssessments.studentId,
        studentName: students.fullName,
        date: dailyAssessments.date,
        summary: dailyAssessments.summary,
        classroomId: dailyAssessments.classroomId,
        createdBy: dailyAssessments.createdBy,
        createdAt: dailyAssessments.createdAt,
      })
      .from(dailyAssessments)
      .leftJoin(students, eq(dailyAssessments.studentId, students.id))
      .where(
        and(
          eq(dailyAssessments.date, date),
          eq(dailyAssessments.classroomId, classroomId),
          studentId ? eq(dailyAssessments.studentId, studentId) : undefined
        )
      )
      .orderBy(desc(dailyAssessments.createdAt));

    // Get assessment items for each daily assessment
    const assessmentIds = dailyAssessmentsData.map(a => a.id);
    let assessmentItemsData: AssessmentItemRecord[] = [];
    
    if (assessmentIds.length > 0) {
      assessmentItemsData = await db
        .select({
          id: assessmentItems.id,
          dailyAssessmentId: assessmentItems.dailyAssessmentId,
          scopeId: assessmentItems.scopeId,
          scopeName: developmentScopes.name,
          objectiveId: assessmentItems.objectiveId,
          objectiveDescription: learningObjectives.description,
          activityContext: assessmentItems.activityContext,
          score: assessmentItems.score,
          note: assessmentItems.note,
          createdAt: assessmentItems.createdAt,
        })
        .from(assessmentItems)
        .leftJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
        .leftJoin(learningObjectives, eq(assessmentItems.objectiveId, learningObjectives.id))
        .where(eq(assessmentItems.dailyAssessmentId, assessmentIds[0])); // Simplified for now
    }

    // Combine data: each daily assessment with its items
    const combinedData = dailyAssessmentsData.map(assessment => ({
      ...assessment,
      items: assessmentItemsData.filter(item => item.dailyAssessmentId === assessment.id),
    }));

    // Filter to only include students from this classroom
    const studentIds = new Set(classroomStudents.map(s => s.id));
    const filteredAssessments = combinedData.filter(a => a.studentId && studentIds.has(a.studentId));

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

    const body: AssessmentRequestBody = await request.json();
    const {
      studentId,
      classroomId,
      date,
      summary,
      items, // Array of assessment items
    } = body;

    // Validate required fields
    if (!studentId || !classroomId || !date || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if daily assessment already exists for this student and date
    const existing = await db
      .select()
      .from(dailyAssessments)
      .where(
        and(
          eq(dailyAssessments.studentId, studentId),
          eq(dailyAssessments.date, date)
        )
      )
      .limit(1);

    let dailyAssessmentId: string;

    if (existing.length > 0) {
      // Update existing daily assessment
      const updated = await db
        .update(dailyAssessments)
        .set({
          summary: summary || null,
        })
        .where(eq(dailyAssessments.id, existing[0].id))
        .returning();
      
      dailyAssessmentId = updated[0].id;

      // Delete old assessment items
      await db
        .delete(assessmentItems)
        .where(eq(assessmentItems.dailyAssessmentId, dailyAssessmentId));
    } else {
      // Create new daily assessment
      const created = await db
        .insert(dailyAssessments)
        .values({
          studentId,
          classroomId,
          date,
          summary: summary || null,
          createdBy: session.user.id,
        })
        .returning();
      
      dailyAssessmentId = created[0].id;
    }

    // Insert assessment items
    const itemsToInsert: Array<typeof assessmentItems.$inferInsert> = items.map((item) => ({
      dailyAssessmentId,
      scopeId: item.scopeId,
      objectiveId: item.objectiveId,
      activityContext: item.activityContext,
      score: item.score,
      note: item.note || null,
    }));

    await db
      .insert(assessmentItems)
      .values(itemsToInsert);

    // Fetch the complete assessment with items
    const result = await db
      .select({
        id: dailyAssessments.id,
        studentId: dailyAssessments.studentId,
        classroomId: dailyAssessments.classroomId,
        date: dailyAssessments.date,
        summary: dailyAssessments.summary,
        createdBy: dailyAssessments.createdBy,
        createdAt: dailyAssessments.createdAt,
      })
      .from(dailyAssessments)
      .where(eq(dailyAssessments.id, dailyAssessmentId))
      .limit(1);

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error creating/updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}
