import { Suspense } from 'react'
import WeeklyReportDetailClient from './weekly-report-detail-client'
import { LoadingState } from '@/components/layout/loading-state'

export default function WeeklyReportDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Memuat laporan..." />}>
      <WeeklyReportDetailClient />
    </Suspense>
  )
}
