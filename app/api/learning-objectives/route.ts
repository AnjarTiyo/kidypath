import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { learningObjectives, developmentScopes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const objectives = await db
      .select({
        id: learningObjectives.id,
        scopeId: learningObjectives.scopeId,
        description: learningObjectives.description,
      })
      .from(learningObjectives)
      .leftJoin(developmentScopes, eq(learningObjectives.scopeId, developmentScopes.id));

    return NextResponse.json({
      data: objectives,
      total: objectives.length,
    });
  } catch (error) {
    console.error('Error fetching learning objectives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning objectives' },
      { status: 500 }
    );
  }
}
