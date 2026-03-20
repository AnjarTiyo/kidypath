import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { monthlyTopics } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'curriculum'].includes(session.user.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const { title, description, semesterTopicId, monthNumber } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 422 });
  if (!semesterTopicId) return NextResponse.json({ error: 'Topik semester wajib diisi' }, { status: 422 });
  const monthNum = Number(monthNumber);
  if (monthNum < 1 || monthNum > 12) return NextResponse.json({ error: 'Bulan harus 1–12' }, { status: 422 });

  // Overlap check: same monthNumber within same semester
  const existing = await db.query.monthlyTopics.findFirst({
    where: (t, { eq, and }) => and(eq(t.semesterTopicId, semesterTopicId), eq(t.monthNumber, monthNum)),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Bulan ${monthNum} sudah ada dalam semester ini` },
      { status: 422 },
    );
  }

  const [created] = await db
    .insert(monthlyTopics)
    .values({
      title: title.trim(),
      description: description?.trim() || null,
      semesterTopicId,
      monthNumber: monthNum,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
