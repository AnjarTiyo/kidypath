import { NextRequest, NextResponse } from 'next/server';
import { auth, isCurriculumCoordinatorSession } from '@/auth';
import { db } from '@/lib/db';
import { weeklyTopics } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'teacher'].includes(session.user.role ?? '') && !isCurriculumCoordinatorSession(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const { title, description, monthlyTopicId, weekNumber } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 422 });
  if (!monthlyTopicId) return NextResponse.json({ error: 'Topik bulanan wajib diisi' }, { status: 422 });
  const weekNum = Number(weekNumber);
  if (weekNum < 1 || weekNum > 6) return NextResponse.json({ error: 'Minggu harus 1–6' }, { status: 422 });

  // Overlap check: same weekNumber within same monthly topic
  const existing = await db.query.weeklyTopics.findFirst({
    where: (t, { eq, and }) => and(eq(t.monthlyTopicId, monthlyTopicId), eq(t.weekNumber, weekNum)),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Minggu ${weekNum} sudah ada dalam bulan ini` },
      { status: 422 },
    );
  }

  const [created] = await db
    .insert(weeklyTopics)
    .values({
      title: title.trim(),
      description: description?.trim() || null,
      monthlyTopicId,
      weekNumber: weekNum,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
