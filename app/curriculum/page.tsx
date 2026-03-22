"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"
import {
  IconUsers,
  IconChartBar,
  IconHome,
  IconLayoutDashboard,
  IconSchool,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react"
import { PageHeader } from "@/components/layout/page-header"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
    return (
      <>
        <PageHeader
          title="Manajemen Kurikulum"
          description="Memuat data..."
          breadcrumbs={[
            { label: "Beranda", href: "/", icon: IconHome },
            { label: "Manajemen Kurikulum", href: "/curriculum", icon: IconSchool },
          ]}
        />
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <Skeleton className="h-12 w-12 sm:h-13 sm:w-13 md:h-14 md:w-14 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2 min-w-0 w-full">
                    <Skeleton className="h-4 sm:h-5 w-3/4" />
                    <Skeleton className="h-3 sm:h-4 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-5/6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )
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
