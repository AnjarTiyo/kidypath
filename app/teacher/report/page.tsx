import { Suspense } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import TeacherReportClient from './teacher-report-client'

const pageFallback = (
  <div className="flex items-center justify-center min-h-[400px]">
    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)

export default function TeacherReportPage() {
  return (
    <Suspense fallback={pageFallback}>
      <TeacherReportClient />
    </Suspense>
  )
}
