"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"
import {
  IconHome,
  IconLayoutDashboard,
  IconSchool,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { LoadingState } from "@/components/layout/loading-state"

const AVAILABLE_MENUS: MenuCardProps[] = [
  {
    icon: IconLayoutDashboard,
    title: "Manajemen Topik",
    description: "Ringkasan data, aktivitas, dan statistik harian",
    href: "/curriculum/topics",
    // roles: ["curriculum_coordinator", "admin"], // Accessible by teacher and admin
  },
  {
    icon: IconCalendar,
    title: "Agenda Kegiatan",
    description: "Ringkasan data, aktivitas, dan statistik harian",
    href: "/curriculum/agenda",
    disabled: true,
    // roles: ["curriculum_coordinator", "admin"], // Accessible by teacher and admin
  },
  {
    icon: IconUser,
    title: "Manajemen Guru Piket",
    description: "Ringkasan data, aktivitas, dan statistik harian",
    href: "/curriculum/teacher-duty",
    // roles: ["curriculum_coordinator", "admin"], // Accessible by teacher and admin
  },
]

export default function CurriculumManagementPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const router = useRouter()
  const isCurriculumCoordinator = useMemo(() => {
    return user?.isCurriculumCoordinator || user?.role === "admin"
  }, [user])

  useEffect(() => {
    if (!userLoading && !isCurriculumCoordinator) {
      router.replace("/unauthorized")
    }
  }, [userLoading, isCurriculumCoordinator, router])

  // Early return for loading state
  if (userLoading) {
    return <LoadingState message="Memuat data..." />
  }

  return (
    <>
      <PageHeader
        title="Manajemen Kurikulum"
        description={`Selamat Datang, ${user!.name || user!.email}!`}
        breadcrumbs={[
          { label: "Beranda", href: "/", icon: IconHome },
          { label: "Manajemen Kurikulum", href: "/curriculum", icon: IconSchool },
        ]}
      />

      <MenuGrid>
        {AVAILABLE_MENUS.map((menu: MenuCardProps) => (
          <MenuCard key={menu.href} {...menu} />
        ))}
      </MenuGrid>
    </>
  )
}
