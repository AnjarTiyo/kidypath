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

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  const availableMenus: MenuCardProps[] = [
    {
      icon: IconLayoutDashboard,
      title: "Dasbor",
      description: "Lihat ringkasan sistem dan statistik",
      href: "/admin/dashboard",
    },
    {
      icon: IconUsers,
      title: "Manajemen Pengguna",
      description: "Kelola akun pengguna, guru, dan orang tua",
      href: "/admin/user",
    },
    {
      icon: IconChalkboardTeacher,
      title: "Manajemen Kelas",
      description: "Kelola kelas",
      href: "/admin/class",
    },
    {
      icon: IconSchool,
      title: "Manajemen Peserta Didik",
      description: "Kelola akun peserta didik",
      href: "/admin/user",
    },
    {
      icon: IconChartBar,
      title: "Laporan",
      description: "Lihat laporan dan analitik sistem",
      href: "/admin/report",
    },
    {
      icon: IconCalendarEvent,
      title: "Manajemen Agenda",
      description: "Kelola agenda",
      href: "/admin/agenda",
    },
    {
      icon: IconSpeakerphone,
      title: "Pengumuman",
      description: "Lihat dan kelola pengumuman sekolah",
      href: "/admin/announcement",
    },
  ]


  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description={`Selamat Datang, ${session.user.name || session.user.email}!`}
        breadcrumbs={[
          { label: "Beranda", href: "/admin", icon: IconHome },
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
