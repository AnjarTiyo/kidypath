import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"
import {
  IconUsers,
  IconChartBar,
  IconHome,
  IconSpeakerphone,
  IconLayoutDashboard,
  IconChalkboardTeacher,
  IconSchool,
  IconCalendarEvent,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"

export default async function TeacherPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "teacher") {
    redirect("/unauthorized")
  }

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


  return (
    <>
      <PageHeader
        title="Teacher Dashboard"
        description={`Selamat Datang, Teacher ${session.user.name || session.user.email}!`}
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
