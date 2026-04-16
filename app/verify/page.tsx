'use client'

import { useSearchParams } from 'next/navigation'
import { use, useMemo, Suspense } from 'react'
import { CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react'

interface VerifyResult {
  valid: boolean
  reason?: string
  teacherName?: string | null
  studentName?: string | null
  weekStart?: string | null
  weekEnd?: string | null
  issuedAt?: number
  reportId?: string
  teacherId?: string
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const t = searchParams.get('t')

  const resultPromise = useMemo<Promise<VerifyResult>>(() => {
    if (!t) {
      return Promise.resolve({ valid: false, reason: 'Token verifikasi tidak ditemukan dalam URL.' })
    }
    return fetch(`/api/verify?t=${encodeURIComponent(t)}`)
      .then((res) => res.json() as Promise<VerifyResult>)
      .catch((): VerifyResult => ({ valid: false, reason: 'Terjadi kesalahan saat memverifikasi dokumen.' }))
  }, [t])

  const result = use(resultPromise)

  if (!result?.valid) {
    return <InvalidView reason={result?.reason ?? 'Verifikasi gagal.'} />
  }

  const studentName = result.studentName ?? null
  const weekRange =
    result.weekStart && result.weekEnd ? `${result.weekStart} – ${result.weekEnd}` : null
  const documentTitle = ['Laporan Mingguan', studentName, weekRange].filter(Boolean).join(' ')

  const issuedDate = result.issuedAt
    ? new Date(result.issuedAt * 1000).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

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
          <InfoRow label="Diterbitkan oleh" value={result.teacherName ?? `ID: ${result.teacherId}`} bold />
          <InfoRow label="Tanggal Tanda Tangan" value={issuedDate} />
          <InfoRow
            label="Judul Dokumen"
            value={documentTitle || `Laporan ID: ${result.reportId}`}
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

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={22} />
          <span className="text-sm">Memverifikasi dokumen...</span>
        </div>
      </main>
    }>
      <VerifyContent />
    </Suspense>
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
