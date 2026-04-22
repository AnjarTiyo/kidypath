"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"
import {
  IconChartBar,
  IconHome,
  IconSchool,
  IconBook,
  IconChalkboardTeacher,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { LoadingState } from "@/components/layout/loading-state"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { useTomorrowLessonPlan } from "@/lib/hooks/use-tomorrow-lesson-plan"
import { useTodayDailyStatus } from "@/lib/hooks/use-today-daily-status"
import { useWeeklyReportStatus } from "@/lib/hooks/use-weekly-report-status"
import { OutstandingTasksBanner } from "@/components/common/tomorrow-lesson-plan-banner"
import { Button } from "@/components/ui/button"

export default function TeacherPage() {
  const router = useRouter()
  const { user, classrooms, loading: userLoading } = useCurrentUser()
  const isUserCurriculumCoordinator = user?.isCurriculumCoordinator || false
  const activeClassrooms = !userLoading && user?.role !== "parent" ? classrooms : []
  const { targetDate, missingClassrooms, isLoading: lessonPlanLoading } = useTomorrowLessonPlan(activeClassrooms)
  const { checkIn, assessment, checkOut, todayLessonPlan, isLoading: statusLoading } = useTodayDailyStatus(activeClassrooms)
  const weeklyReport = useWeeklyReportStatus(activeClassrooms)
  const bannerLoading = lessonPlanLoading || statusLoading

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login")
    }
    if (!userLoading && user && user.role === "parent") {
      router.push("/unauthorized")
    }
  }, [user, userLoading, router])

  const availableMenus: MenuCardProps[] = [
    {
      icon: IconChalkboardTeacher,
      title: "Rencana Pembelajaran",
      description: "Kelola agenda dan rencana pembelajaran harian",
      href: "/teacher/lesson-plan",
    },
    {
      icon: IconSchool,
      title: "Penilaian Peserta Didik",
      description: "Kelola penilaian dan perkembangan peserta didik",
      href: "/teacher/assesment",
    },
    {
      icon: IconChartBar,
      title: "Laporan",
      description: "Lihat laporan kehadiran, penilaian, dan laporan mingguan",
      href: "/teacher/report",
    },
    {
      icon: IconBook,
      title: "Manajemen Kurikulum",
      description: "Kelola topik pembelajaran dan kalender pendidikan",
      href: "/curriculum",
      hidden: !!!isUserCurriculumCoordinator,
      className: "border-amber-400 border-2 bg-amber-300 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950",
      iconClassName: "bg-amber-100 text-primary group-hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300",
    }
  ]

  if (userLoading) {
    return <LoadingState message="Memuat data..." />
  }

  if (!user) {
    return null
  }

  const classroomNames = classrooms.length > 0
    ? classrooms.map(c => c.name).join(", ")
    : <span className="text-destructive font-semibold">Tidak ada kelas</span>

  return (
    <>
      <div className="flex flex-row justify-between items-center border-b">
        <PageHeader
          title="Aplikasi Teacher"
          description={`Selamat Datang, Teacher ${user.name || user.email}!`}
          subDesc={<>Kelas: {classroomNames}</>}
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
          ]}
          border={false}
        />
        <Button variant="secondary" className="text-md text-primary font-bold">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Button>
      </div>

      {!bannerLoading && (
        <OutstandingTasksBanner
          targetDate={targetDate}
          missingClassrooms={missingClassrooms}
          todayLessonPlan={todayLessonPlan}
          checkIn={checkIn}
          assessment={assessment}
          checkOut={checkOut}
          weeklyReport={weeklyReport.isLoading ? null : weeklyReport}
        />
      )}

      <MenuGrid>
        {availableMenus.map((menu, index) => (
          <MenuCard key={index} {...menu} />
        ))}
      </MenuGrid>
    </>
  )
}
