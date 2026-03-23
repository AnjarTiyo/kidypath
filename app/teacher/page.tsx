"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"
import {
  IconChartBar,
  IconHome,
  IconLayoutDashboard,
  IconSchool,
  IconBook,
  IconChalkboardTeacher,
  IconChecklist,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { LoadingState } from "@/components/layout/loading-state"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Button } from "@/components/ui/button"

export default function TeacherPage() {
  const router = useRouter()
  const { user, classrooms, loading: userLoading } = useCurrentUser()
  const isUserCurriculumCoordinator = user?.isCurriculumCoordinator || false

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login")
    }
    if (!userLoading && user && user.role !== "teacher") {
      router.push("/unauthorized")
    }
  }, [user, userLoading, router])

  const availableMenus: MenuCardProps[] = [
    {
      icon: IconChecklist,
      title: "TODO List Hari ini",
      description: "Lihat dan kelola tugas serta agenda harian Anda",
      href: "/teacher/dashboard",
      disabled: true
    },
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
      hidden: !!!isUserCurriculumCoordinator, // Hidden for now, can be enabled later
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
    : "Belum ada kelas"

  return (
    <>
      <div className="flex flex-row justify-between items-center border-b">
        <PageHeader
          title="Aplikasi Teacher"
          description={`Selamat Datang, Teacher ${user.name || user.email}!`}
          subDesc={`Kelas: ${classroomNames}`}
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

      <MenuGrid>
        {availableMenus.map((menu, index) => (
          <MenuCard key={index} {...menu} />
        ))}
      </MenuGrid>
    </>
  )
}
