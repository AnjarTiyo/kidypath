import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { monthlyTopics } from '@/lib/db/schema';

type Params = { params: Promise<{ id: string }> };

async function authorize() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!['admin', 'curriculum'].includes(session.user.role ?? ''))
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { session };
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const { title, description, monthNumber, semesterTopicId } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 422 });
  const monthNum = Number(monthNumber);
  if (monthNum < 1 || monthNum > 12) return NextResponse.json({ error: 'Bulan harus 1–12' }, { status: 422 });

  // Overlap check: another record with same monthNumber in same semester (excluding self)
  const current = await db.query.monthlyTopics.findFirst({ where: (t, { eq }) => eq(t.id, id) });
  if (!current) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

  const sid = semesterTopicId ?? current.semesterTopicId;
  const existing = await db.query.monthlyTopics.findFirst({
    where: (t, { eq, and, ne }) => and(eq(t.semesterTopicId, sid), eq(t.monthNumber, monthNum), ne(t.id, id)),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Bulan ${monthNum} sudah ada dalam semester ini` },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(monthlyTopics)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      monthNumber: monthNum,
      updatedAt: new Date(),
    })
    .where(eq(monthlyTopics.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { id } = await params;
  const [deleted] = await db.delete(monthlyTopics).where(eq(monthlyTopics.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ message: 'Berhasil dihapus' });
}
