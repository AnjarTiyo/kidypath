import { Suspense } from 'react'
import { DashboardFiltersProvider } from '@/components/admin/dashboard/dashboard-filters-context'
import { DashboardFilterBar } from '@/components/admin/dashboard/dashboard-filter-bar'
import { ExecutiveOverview } from '@/components/admin/dashboard/executive-overview'
import { AttendanceMoodSection } from '@/components/admin/dashboard/attendance-mood-section'
import { DevelopmentProgressSection } from '@/components/admin/dashboard/development-progress-section'
import { ClassroomPerformanceSection } from '@/components/admin/dashboard/classroom-performance-section'
import { StudentRiskPanel } from '@/components/admin/dashboard/student-risk-panel'
import { CurriculumExecutionSection } from '@/components/admin/dashboard/curriculum-execution-section'
import { LessonPlanAnalyticsSection } from '@/components/admin/dashboard/lesson-plan-analytics-section'
import { ReportHealthSection } from '@/components/admin/dashboard/report-health-section'
import { ActivityInsightsSection } from '@/components/admin/dashboard/activity-insights-section'
import { Separator } from '@/components/ui/separator'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
        {children}
      </h2>
      <Separator className="flex-1" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="py-24 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
      Memuat dashboard...
    </div>
  )
}

function DashboardContent() {
  return (
    <DashboardFiltersProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kids Intelligence Command Center</h1>
            <p className="text-sm text-muted-foreground">Pusat analitik & pengambilan keputusan sekolah</p>
          </div>
          <DashboardFilterBar />
        </div>

        {/* Section 1: Executive Overview */}
        <section className="space-y-4">
          <SectionLabel>01 — Ringkasan Eksekutif</SectionLabel>
          <ExecutiveOverview />
        </section>

        {/* Section 2: Attendance & Mood */}
        <section className="space-y-4">
          <SectionLabel>02 — Kehadiran & Mood Siswa</SectionLabel>
          <AttendanceMoodSection />
        </section>

        {/* Section 3: Development Progress */}
        <section className="space-y-4">
          <SectionLabel>03 — Profil Perkembangan Sekolah</SectionLabel>
          <DevelopmentProgressSection />
        </section>

        {/* Section 4: Classroom Performance */}
        <section className="space-y-4">
          <SectionLabel>04 — Perbandingan Performa Kelas</SectionLabel>
          <ClassroomPerformanceSection />
        </section>

        {/* Section 5: Student Risk */}
        <section className="space-y-4">
          <SectionLabel>05 — Deteksi Risiko & Prestasi Siswa</SectionLabel>
          <StudentRiskPanel />
        </section>

        {/* Section 6: Curriculum Execution */}
        <section className="space-y-4">
          <SectionLabel>06 — Monitoring Pelaksanaan Kurikulum</SectionLabel>
          <CurriculumExecutionSection />
        </section>

        {/* Section 7: Lesson Plan Analytics */}
        <section className="space-y-4">
          <SectionLabel>07 — Analitik Rencana Pembelajaran Guru</SectionLabel>
          <LessonPlanAnalyticsSection />
        </section>

        {/* Section 8: Report Health */}
        <section className="space-y-4">
          <SectionLabel>08 — Kesehatan Pelaporan</SectionLabel>
          <ReportHealthSection />
        </section>

        {/* Section 9: Activity Insights */}
        <section className="space-y-4 pb-8">
          <SectionLabel>09 — Aktivitas & Wawasan Pembelajaran</SectionLabel>
          <ActivityInsightsSection />
        </section>
      </div>
    </DashboardFiltersProvider>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}