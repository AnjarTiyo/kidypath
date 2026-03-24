"use client";

import { useRouter } from "next/navigation"
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
  IconBook,
  IconCalendarOff,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useEffect } from "react";
import { LoadingState } from "@/components/layout/loading-state";

export default function AdminPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const router = useRouter()
  const isUserCurriculumCoordinator = user?.isCurriculumCoordinator || false


  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login")
    }
    if (!userLoading && user && user.role !== "admin") {
      router.push("/unauthorized")
    }
  }, [user, userLoading, router])

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
      title: "Manajemen Rombongan Belajar",
      description: "Kelola Rombongan Belajar",
      href: "/admin/classroom",
    },
    {
      icon: IconSchool,
      title: "Manajemen Peserta Didik",
      description: "Kelola akun peserta didik",
      href: "/admin/student",
    },
    {
      icon: IconChartBar,
      title: "Laporan",
      description: "Lihat laporan dan analitik sistem",
      href: "/admin/report",
    },
    {
      icon: IconCalendarOff,
      title: "Manajemen Hari Libur",
      description: "Kelola hari libur sekolah untuk perhitungan hari efektif",
      href: "/admin/day-off",
    },
    {
      icon: IconCalendarEvent,
      title: "Manajemen Agenda",
      description: "Kelola agenda",
      href: "/admin/agenda",
      disabled: true
    },
    {
      icon: IconSpeakerphone,
      title: "Pengumuman",
      description: "Lihat dan kelola pengumuman sekolah",
      href: "/admin/announcement",
      disabled: true
    },
    {
      icon: IconBook,
      title: "Manajemen Kurikulum",
      description: "Kelola kurikulum dan topik pembelajaran",
      href: "/curriculum",
      hidden: !isUserCurriculumCoordinator, // Only show if user is curriculum coordinator
    }
  ]

  if (userLoading) {
    return <LoadingState message="Memuat data..." />
  }

  if (!user) {
    return null
  }

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description={`Selamat Datang, ${user!.name || user!.email}!`}
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
