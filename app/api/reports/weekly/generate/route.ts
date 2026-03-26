import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  attendances,
  assessmentItems,
  dailyAssessments,
  students,
  classroomTeachers,
  learningObjectives,
  developmentScopes,
} from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { studentId, weekStart, weekEnd } = body;

    if (!studentId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'studentId, weekStart, and weekEnd are required' },
        { status: 400 }
      );
    }

    // Verify teacher access
    if (role === 'teacher') {
      const student = await db
        .select({ classroomId: students.classroomId })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);
      if (!student[0]?.classroomId) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      const assignment = await db
        .select({ id: classroomTeachers.id })
        .from(classroomTeachers)
        .where(
          and(
            eq(classroomTeachers.classroomId, student[0].classroomId),
            eq(classroomTeachers.teacherId, userId)
          )
        )
        .limit(1);
      if (assignment.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch student info
    const [studentInfo] = await db
      .select({ fullName: students.fullName })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    // Fetch week attendance
    const attendanceRecords = await db
      .select({
        date: attendances.date,
        status: attendances.status,
        mood: attendances.mood,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.studentId, studentId),
          gte(attendances.date, weekStart),
          lte(attendances.date, weekEnd),
          eq(attendances.type, 'check_in')
        )
      );

    // Fetch week assessments
    const assessmentRows = await db
      .select({
        date: dailyAssessments.date,
        scope: developmentScopes.name,
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
      .leftJoin(
        learningObjectives,
        eq(assessmentItems.objectiveId, learningObjectives.id)
      )
      .leftJoin(
        developmentScopes,
        eq(assessmentItems.scopeId, developmentScopes.id)
      )
      .where(
        and(
          eq(dailyAssessments.studentId, studentId),
          gte(dailyAssessments.date, weekStart),
          lte(dailyAssessments.date, weekEnd)
        )
      );

    const SCOPE_LABEL: Record<string, string> = {
      religious_moral: 'Nilai Agama dan Moral',
      physical_motor: 'Fisik Motorik',
      cognitive: 'Kognitif',
      language: 'Bahasa',
      social_emotional: 'Sosial Emosional',
      art: 'Seni',
    };

    const attendanceSummary = attendanceRecords
      .map((r) => `${r.date}: ${r.status}${r.mood ? `, mood: ${r.mood}` : ''}`)
      .join('\n');

    const assessmentSummary = assessmentRows
      .map(
        (r, i) =>
          `${i + 1}. [${r.date}] ${SCOPE_LABEL[r.scope ?? ''] ?? r.scope}: ${r.objectiveDescription ?? '-'} | Aktivitas: ${r.activityContext ?? '-'} | Capaian: ${r.score}${r.note ? ` | Catatan: ${r.note}` : ''}`
      )
      .join('\n');

    const systemPrompt = `Kamu adalah guru PAUD/TK di Indonesia yang menulis laporan mingguan perkembangan anak untuk dikirim kepada orang tua.
Tulis laporan yang hangat, jujur, dan mudah dipahami orang tua dalam Bahasa Indonesia.
Gunakan emoji secukupnya. Jangan tampilkan kode nilai (BB/MB/BSH/BSB) secara langsung — ubah menjadi deskripsi.`;

    const userPrompt = `Buat Laporan Mingguan Anak untuk orang tua.

Nama Anak: ${studentInfo?.fullName ?? 'Siswa'}
Periode: ${weekStart} hingga ${weekEnd}

--- REKAP KEHADIRAN ---
${attendanceSummary || 'Tidak ada data kehadiran'}

--- PENILAIAN HARIAN ---
${assessmentSummary || 'Tidak ada data penilaian'}

--- FORMAT OUTPUT ---
Judul: Laporan Mingguan – [Nama Anak] – Minggu [Tanggal Mulai] s.d. [Tanggal Selesai]

📅 Ringkasan Kehadiran
Sebutkan jumlah hari hadir, tidak hadir (sakit/izin), dan mood dominan minggu ini.

📚 Perkembangan Minggu Ini
Tulis 3–5 poin perkembangan berdasarkan penilaian harian:
- Aspek yang sudah berkembang dengan baik
- Aspek yang masih dalam proses
- Aktivitas yang paling menonjol

❤️ Catatan Guru
Tulis 2–3 kalimat tentang kondisi emosional dan sosial anak minggu ini. Jujur tapi penuh semangat.

🏠 Rekomendasi untuk Orang Tua
1–2 aktivitas sederhana di rumah untuk mendukung perkembangan minggu depan.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: process.env.GROQ_AI_MODEL!,
      temperature: 0.7,
      max_tokens: 700,
      stream: false,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      return NextResponse.json({ error: 'AI failed to generate summary' }, { status: 500 });
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
