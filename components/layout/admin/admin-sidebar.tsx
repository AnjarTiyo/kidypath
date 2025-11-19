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
  IconReplaceUser,
  IconSchool,
  IconShieldCog,
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
      title: "Supervisi",
      url: "#",
      icon: IconListCheck,
      isActive: false,
    },
    {
      title: "Pelaksanaan KBM",
      url: "#",
      icon: IconChalkboard,
    },
    {
      title: "Kalender KBM",
      url: "#",
      icon: IconCalendar,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  navAttendance: [
    {
      title: "Rekapitulasi GTK",
      url: "#",
      icon: IconUserScan,
      isActive: false,
    },
    {
      title: "Prosentase GTK",
      url: "#",
      icon: IconCirclePercentage,
    },
    {
      title: "Rekapitulasi Siswa",
      url: "#",
      icon: IconSchool,
    },
  ],
  navJournal: [
    {
      title: "Jurnal Mengajar",
      url: "#",
      icon: IconNotebook,
      isActive: false,
    },
  ],
  navMasterData: [
    // {
    //   title: "Mata Pelajaran",
    //   url: "#",
    //   icon: IconMath,
    //   isActive: false,
    // },
    {
      title: "Ruang/Rombel",
      url: "/admin/class",
      icon: IconHomeCog,
      isActive: false,
    },
    {
      title: "Jam KBM",
      url: "/admin/timesheet",
      icon: IconClock,
      isActive: false,
    },
    {
      title: "GTK",
      url: "/admin/teacher",
      icon: IconUsersGroup,
      isActive: false,
    },
    {
      title: "Guru Kelas",
      url: "/admin/class-teacher",
      icon: IconChalkboardTeacher,
      isActive: false,
    },
    {
      title: "Jadwal KBM",
      url: "#",
      icon: IconCalendarCode,
      isActive: false,
    },
    {
      title: "Siswa",
      url: "#",
      icon: IconUsersGroup,
      isActive: false,
    },
  ],
  navConfig: [
    {
      title: "Sekolah",
      url: "#",
      icon: IconBuilding,
    },
    {
      title: "Admin",
      url: "#",
      icon: IconShieldCog,
    },
    {
      title: "Petugas PPKBM",
      url: "#",
      icon: IconReplaceUser,
    },
    {
      title: "Aplikasi",
      url: "#",
      icon: IconApps,
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navActivity} label="Kegiatan" />
        <NavMain items={data.navAttendance} label="Kehadiran" />
        <NavMain items={data.navJournal} label="Jurnal" />
        <NavMain items={data.navMasterData} label="Master Data" />
        <NavSecondary items={data.navConfig} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
