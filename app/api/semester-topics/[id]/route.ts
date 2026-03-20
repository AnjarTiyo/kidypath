import { NextRequest, NextResponse } from 'next/server';
import { eq, and, ne } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { semesterTopics } from '@/lib/db/schema';

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

  const { title, description, academicYear, semesterNumber } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 422 });
  if (!academicYear?.trim()) return NextResponse.json({ error: 'Tahun akademik wajib diisi' }, { status: 422 });
  const semNum = Number(semesterNumber);
  if (![1, 2].includes(semNum)) return NextResponse.json({ error: 'Semester harus 1 atau 2' }, { status: 422 });

  // Overlap check: another record with same academicYear + semesterNumber
  const existing = await db.query.semesterTopics.findFirst({
    where: (t, { eq, and, ne }) =>
      and(eq(t.academicYear, academicYear.trim()), eq(t.semesterNumber, semNum), ne(t.id, id)),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Semester ${semNum} tahun akademik ${academicYear.trim()} sudah ada` },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(semesterTopics)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      academicYear: academicYear.trim(),
      semesterNumber: semNum,
      updatedAt: new Date(),
    })
    .where(eq(semesterTopics.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { id } = await params;
  const [deleted] = await db.delete(semesterTopics).where(eq(semesterTopics.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ message: 'Berhasil dihapus' });
}
