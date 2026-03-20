import { MenuCardProps } from "@/components/layout/menu-card"
import {
  IconLayoutDashboard,
  IconUsers,
  IconChartBar,
  IconSchool,
  IconChalkboardTeacher,
  IconCalendarEvent,
  IconSpeakerphone,
  IconFileText,
  IconSettings,
} from "@tabler/icons-react"

/**
 * Teacher dashboard menus
 */
export const teacherMenus: MenuCardProps[] = [
  {
    icon: IconLayoutDashboard,
    title: "Dasbor",
    description: "Ringkasan data, aktivitas, dan statistik harian",
    href: "/teacher/dashboard",
    roles: ["teacher", "admin"],
  },
  {
    icon: IconFileText,
    title: "Rencana Pembelajaran",
    description: "Kelola agenda dan rencana pembelajaran harian",
    href: "/teacher/lesson-plan",
    roles: ["teacher"],
  },
  {
    icon: IconSchool,
    title: "Penilaian Peserta Didik",
    description: "Kelola penilaian dan perkembangan peserta didik",
    href: "/teacher/assesment",
    roles: ["teacher"],
  },
  {
    icon: IconChartBar,
    title: "Laporan",
    description: "Lihat laporan harian, mingguan, dan bulanan",
    href: "/teacher/report",
    roles: ["teacher", "admin"],
  },
]

/**
 * Admin dashboard menus
 */
export const adminMenus: MenuCardProps[] = [
  {
    icon: IconLayoutDashboard,
    title: "Dasbor",
    description: "Lihat ringkasan sistem dan statistik",
    href: "/admin/dashboard",
    roles: ["admin"],
  },
  {
    icon: IconUsers,
    title: "Manajemen Pengguna",
    description: "Kelola akun pengguna, guru, dan orang tua",
    href: "/admin/user",
    roles: ["admin"],
  },
  {
    icon: IconChalkboardTeacher,
    title: "Manajemen Rombongan Belajar",
    description: "Kelola Rombongan Belajar",
    href: "/admin/classroom",
    roles: ["admin"],
  },
  {
    icon: IconSchool,
    title: "Manajemen Peserta Didik",
    description: "Kelola akun peserta didik",
    href: "/admin/student",
    roles: ["admin"],
  },
  {
    icon: IconChartBar,
    title: "Laporan",
    description: "Lihat laporan dan analitik sistem",
    href: "/admin/report",
    roles: ["admin", "teacher"],
  },
  {
    icon: IconCalendarEvent,
    title: "Manajemen Agenda",
    description: "Kelola agenda",
    href: "/admin/agenda",
    roles: ["admin"],
  },
  {
    icon: IconSpeakerphone,
    title: "Pengumuman",
    description: "Lihat dan kelola pengumuman sekolah",
    href: "/admin/announcement",
    roles: ["admin"],
  },
]

/**
 * Parent dashboard menus
 */
export const parentMenus: MenuCardProps[] = [
  {
    icon: IconUsers,
    title: "Anak Saya",
    description: "Lihat informasi anak",
    href: "/parent/children",
    roles: ["parent"],
  },
  {
    icon: IconFileText,
    title: "Laporan Harian",
    description: "Lihat laporan penilaian harian",
    href: "/parent/daily-reports",
    roles: ["parent"],
  },
  {
    icon: IconChartBar,
    title: "Laporan Mingguan",
    description: "Review ringkasan perkembangan mingguan",
    href: "/parent/weekly-reports",
    roles: ["parent"],
  },
  {
    icon: IconCalendarEvent,
    title: "Agenda Kegiatan",
    description: "Lihat kegiatan mendatang",
    href: "/parent/activities",
    roles: ["parent"],
  },
]

/**
 * Get menus by user role
 * @param role - User role
 * @returns Array of menu items for the role
 */
export function getMenusByRole(role: string | null | undefined): MenuCardProps[] {
  switch (role) {
    case "admin":
      return adminMenus
    case "teacher":
      return teacherMenus
    case "parent":
      return parentMenus
    default:
      return []
  }
}
