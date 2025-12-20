"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"
import {
  IconUsers,
  IconChartBar,
  IconHome,
  IconLayoutDashboard,
  IconSchool,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"

export default function TeacherPage() {
  const router = useRouter()
  const { user, classrooms, loading: userLoading } = useCurrentUser()

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
    },
    {
      icon: IconUsers,
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
    // {
    //   icon: IconChalkboardTeacher,
    //   title: "Jurnal Harian",
    //   description: "Catatan kegiatan harian tiap kelas",
    //   href: "/teacher/journal",
    // },
    {
      icon: IconChartBar,
      title: "Laporan",
      description: "Lihat laporan harian, mingguan, dan bulanan",
      href: "/teacher/report",
    },
  ]

  if (userLoading) {
    return (
      <>
        <PageHeader
          title="Teacher Dashboard"
          description="Memuat data..."
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
          ]}
        />
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">Memuat data...</p>
          </CardContent>
        </Card>
      </>
    )
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
