import type { Metadata } from 'next'
import { CheckCircle2, XCircle, Shield } from 'lucide-react'
import { verifyToken } from '@/lib/utils/signature'
import { db } from '@/lib/db'
import { weeklyReports, students, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const metadata: Metadata = {
  title: 'Verifikasi Dokumen – KidyPath',
}

interface PageProps {
  searchParams: Promise<{ t?: string }>
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { t } = await searchParams

  if (!t) {
    return <InvalidView reason="Token verifikasi tidak ditemukan dalam URL." />
  }

  const payload = verifyToken(decodeURIComponent(t))
  if (!payload) {
    return (
      <InvalidView reason="Tanda tangan digital tidak valid atau telah dimanipulasi. Dokumen tidak dapat diverifikasi." />
    )
  }

  // Fetch supporting data for display (best-effort)
  const [report] = await db
    .select({ weekStart: weeklyReports.weekStart, weekEnd: weeklyReports.weekEnd, studentId: weeklyReports.studentId })
    .from(weeklyReports)
    .where(eq(weeklyReports.id, payload.rid))
    .limit(1)

  const [student] = report?.studentId
    ? await db
        .select({ fullName: students.fullName })
        .from(students)
        .where(eq(students.id, report.studentId!))
        .limit(1)
    : []

  const [teacher] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1)

  const studentName = student?.fullName ?? null
  const weekRange =
    report?.weekStart && report?.weekEnd
      ? `${report.weekStart} – ${report.weekEnd}`
      : null
  const documentTitle = ['Laporan Mingguan', studentName, weekRange]
    .filter(Boolean)
    .join(' ')

  const issuedDate = new Date(payload.iat * 1000).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Green header */}
        <div className="bg-green-500 px-6 py-5 flex items-center gap-4">
          <CheckCircle2 className="text-white shrink-0" size={38} />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Dokumen Terverifikasi</h1>
            <p className="text-green-100 text-xs mt-0.5">
              Dokumen berasal dari KidyPath dan adalah asli.
            </p>
          </div>
        </div>

        {/* Detail rows */}
        <div className="px-6 py-5 space-y-4">
          <InfoRow label="Diterbitkan oleh" value={teacher?.name ?? `ID: ${payload.sub}`} bold />
          <InfoRow label="Tanggal Tanda Tangan" value={issuedDate} />
          <InfoRow
            label="Judul Dokumen"
            value={documentTitle || `Laporan ID: ${payload.rid}`}
            bold
          />
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center gap-2 text-xs text-gray-400">
          <Shield size={14} />
          KidyPath – Sistem Jurnal Harian TK Putra 1 Mataram
        </div>
      </div>
    </main>
  )
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}

function InvalidView({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-red-500 px-6 py-5 flex items-center gap-4">
          <XCircle className="text-white shrink-0" size={38} />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Dokumen Tidak Valid</h1>
            <p className="text-red-100 text-xs mt-0.5">Verifikasi tanda tangan gagal.</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">{reason}</p>
        </div>
        <div className="border-t px-6 py-4 flex items-center gap-2 text-xs text-gray-400">
          <Shield size={14} />
          KidyPath – Sistem Jurnal Harian TK Putra 1 Mataram
        </div>
      </div>
    </main>
  )
}
