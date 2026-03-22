import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth, isCurriculumCoordinatorSession } from '@/auth';
import { db } from '@/lib/db';
import { weeklyTopics } from '@/lib/db/schema';

type Params = { params: Promise<{ id: string }> };

async function authorize() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!['admin', 'teacher'].includes(session.user.role ?? '') && !isCurriculumCoordinatorSession(session))
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { session };
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const { title, description, weekNumber, monthlyTopicId } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 422 });
  const weekNum = Number(weekNumber);
  if (weekNum < 1 || weekNum > 6) return NextResponse.json({ error: 'Minggu harus 1–6' }, { status: 422 });

  const current = await db.query.weeklyTopics.findFirst({ where: (t, { eq }) => eq(t.id, id) });
  if (!current) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

  const mid = monthlyTopicId ?? current.monthlyTopicId;
  const existing = await db.query.weeklyTopics.findFirst({
    where: (t, { eq, and, ne }) => and(eq(t.monthlyTopicId, mid), eq(t.weekNumber, weekNum), ne(t.id, id)),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Minggu ${weekNum} sudah ada dalam bulan ini` },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(weeklyTopics)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      weekNumber: weekNum,
      updatedAt: new Date(),
    })
    .where(eq(weeklyTopics.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { id } = await params;
  const [deleted] = await db.delete(weeklyTopics).where(eq(weeklyTopics.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ message: 'Berhasil dihapus' });
}
