import { Suspense } from 'react'
import { DashboardFiltersProvider } from '@/components/admin/dashboard/dashboard-filters-context'
import { DashboardFilterBar } from '@/components/admin/dashboard/dashboard-filter-bar'
import { ExecutiveOverview } from '@/components/admin/dashboard/executive-overview'
import { AttendanceMoodSection } from '@/components/admin/dashboard/attendance-mood-section'
import { DevelopmentProgressSection } from '@/components/admin/dashboard/development-progress-section'
import { TopicAchievementSection } from '@/components/admin/dashboard/topic-achievement-section'
import { ClassroomPerformanceSection } from '@/components/admin/dashboard/classroom-performance-section'
import { StudentRiskPanel } from '@/components/admin/dashboard/student-risk-panel'
import { CurriculumExecutionSection } from '@/components/admin/dashboard/curriculum-execution-section'
import { LessonPlanAnalyticsSection } from '@/components/admin/dashboard/lesson-plan-analytics-section'
import { ReportHealthSection } from '@/components/admin/dashboard/report-health-section'
import { ActivityInsightsSection } from '@/components/admin/dashboard/activity-insights-section'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/page-header'
import { IconHome, IconLayout } from '@tabler/icons-react'

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
            <PageHeader
              title="Dashboard Admin"
              description="Analitik mendalam untuk memantau kesehatan sekolah dan mendukung pengambilan keputusan berbasis data."
              breadcrumbs={[
                { label: 'Admin', href: '/', icon: IconHome },
                { label: 'Dashboard', href: '/admin/dashboard', icon: IconLayout },
              ]}
            />
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

        {/* Section 4: Topic Achievement */}
        <section className="space-y-4">
          <SectionLabel>04 — Analisa Ketercapaian Topik</SectionLabel>
          <TopicAchievementSection />
        </section>

        {/* Section 5: Classroom Performance */}
        <section className="space-y-4">
          <SectionLabel>05 — Perbandingan Performa Kelas</SectionLabel>
          <ClassroomPerformanceSection />
        </section>

        {/* Section 6: Student Risk */}
        <section className="space-y-4">
          <SectionLabel>06 — Deteksi Risiko & Prestasi Siswa</SectionLabel>
          <StudentRiskPanel />
        </section>

        {/* Section 7: Curriculum Execution */}
        <section className="space-y-4">
          <SectionLabel>07 — Monitoring Pelaksanaan Kurikulum</SectionLabel>
          <CurriculumExecutionSection />
        </section>

        {/* Section 8: Lesson Plan Analytics */}
        <section className="space-y-4">
          <SectionLabel>08 — Analitik Rencana Pembelajaran Guru</SectionLabel>
          <LessonPlanAnalyticsSection />
        </section>

        {/* Section 9: Report Health */}
        <section className="space-y-4">
          <SectionLabel>09 — Kesehatan Pelaporan</SectionLabel>
          <ReportHealthSection />
        </section>

        {/* Section 10: Activity Insights */}
        <section className="space-y-4 pb-8">
          <SectionLabel>10 — Aktivitas & Wawasan Pembelajaran</SectionLabel>
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