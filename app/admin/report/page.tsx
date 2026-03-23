import { Suspense } from 'react'
import { LoadingState } from '@/components/layout/loading-state'
import AdminReportClient from './admin-report-client'

export default function AdminReportPage() {
  return (
    <Suspense fallback={<LoadingState message="Memuat halaman laporan..." />}>
      <AdminReportClient />
    </Suspense>
  )
}
