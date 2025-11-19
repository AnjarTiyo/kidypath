"use client"

import * as React from "react"
import {
  IconApps,
  IconBuilding,
  IconBuildingBank,
  IconCalendar,
  IconCalendarCode,
  IconChalkboard,
  IconChalkboardTeacher,
  IconCirclePercentage,
  IconClock,
  IconHomeCog,
  IconListCheck,
  IconMath,
  IconNotebook,
  IconPrinter,
  IconReplaceUser,
  IconSchool,
  IconShieldCog,
  IconStar,
  IconUserScan,
  IconUsersGroup
} from "@tabler/icons-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Administrator",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navActivity: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconListCheck,
      isActive: false,
    },
    {
      title: "Perencanaan KBM",
      url: "#",
      icon: IconChalkboard,
    },
    {
      title: "Presensi",
      url: "#",
      icon: IconCalendar,
    },
    {
      title: "Data Siswa",
      url: "#",
      icon: IconUsersGroup,
    },
    {
      title: "Nilai",
      url: "#",
      icon: IconStar,
    },
    {
      title: "Jurnal",
      url: "#",
      icon: IconNotebook,
    },
    {
      title: "Cetak Jurnal",
      url: "#",
      icon: IconPrinter,
    },
  ],
}

export function TeacherSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <IconBuildingBank className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">TK Putra 1</span>
                  <span className="truncate text-xs">Mataram, NTB</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navActivity} label="Menu Utama" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
