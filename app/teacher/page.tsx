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
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { LoadingState } from "@/components/layout/loading-state"
import { useCurrentUser } from "@/lib/hooks/use-current-user"

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
      icon: IconLayoutDashboard,
      title: "Dasbor",
      description: "Ringkasan data, aktivitas, dan statistik harian",
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
      description: "Lihat laporan harian, mingguan, dan bulanan",
      href: "/teacher/report",
      disabled: true,
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
      <PageHeader
        title="Teacher Dashboard"
        description={`Selamat Datang, ${user.name || user.email}!`}
        subDesc={`Kelas: ${classroomNames}`}
        breadcrumbs={[
          { label: "Beranda", href: "/teacher", icon: IconHome },
        ]}
      />

      <MenuGrid>
        {availableMenus.map((menu, index) => (
          <MenuCard key={index} {...menu} />
        ))}
      </MenuGrid>
    </>
  )
}
