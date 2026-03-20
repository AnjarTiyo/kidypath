import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { semesterTopics } from '@/lib/db/schema';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['admin', 'curriculum'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await db.query.semesterTopics.findMany({
    orderBy: (t, { asc }) => [asc(t.academicYear), asc(t.semesterNumber)],
    with: {
      monthlyTopics: {
        orderBy: (m, { asc }) => [asc(m.monthNumber)],
        with: {
          weeklyTopics: {
            orderBy: (w, { asc }) => [asc(w.weekNumber)],
          },
        },
      },
    },
  });

  const data = rows.map((semester) => ({
    id: semester.id,
    title: semester.title,
    description: semester.description,
    academicYear: semester.academicYear,
    semesterNumber: semester.semesterNumber,
    monthlyTopics: semester.monthlyTopics.map((monthly) => ({
      monthlyTopicId: monthly.id,
      title: monthly.title,
      description: monthly.description,
      month: monthly.monthNumber
        ? MONTHS_ID[(monthly.monthNumber - 1) % 12]
        : '',
      monthNumber: monthly.monthNumber,
      weeklyTopics: monthly.weeklyTopics.map((weekly) => ({
        weeklyTopicId: weekly.id,
        title: weekly.title,
        description: weekly.description,
        week: weekly.weekNumber ?? 0,
        dateRange: `Minggu ${weekly.weekNumber ?? ''}`,
        monthlyTopicId: monthly.id,
      })),
    })),
  }));

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'curriculum'].includes(session.user.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });

  const { title, description, academicYear, semesterNumber } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 422 });
  if (!academicYear?.trim()) return NextResponse.json({ error: 'Tahun akademik wajib diisi' }, { status: 422 });
  const semNum = Number(semesterNumber);
  if (![1, 2].includes(semNum)) return NextResponse.json({ error: 'Semester harus 1 atau 2' }, { status: 422 });

  // Overlap check: same academicYear + semesterNumber must be unique
  const existing = await db.query.semesterTopics.findFirst({
    where: (t, { eq, and }) => and(eq(t.academicYear, academicYear.trim()), eq(t.semesterNumber, semNum)),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Semester ${semNum} tahun akademik ${academicYear.trim()} sudah ada` },
      { status: 422 },
    );
  }

  const [created] = await db
    .insert(semesterTopics)
    .values({
      title: title.trim(),
      description: description?.trim() || null,
      academicYear: academicYear.trim(),
      semesterNumber: semNum,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
