import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconImageInPicture } from "@tabler/icons-react"
import { MenuCard, MenuCardProps, MenuGrid } from "@/components/layout/menu-card"

export default async function ParentPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "parent") {
    redirect("/unauthorized")
  }

  const availableMenus: MenuCardProps[] = [
    {
      icon: IconHome,
      title: "Laporan Mingguan",
      description: "Lihat laporan perkembangan dan laporan mingguan anak",
      href: "/parent/report",
    },
    {
      icon: IconImageInPicture,
      title: "Galeri Ananda",
      description: "Lihat galeri foto dan video anak",
      href: "/parent/gallery",
      disabled: true,
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Parent Dashboard"
        description="Lihat laporan perkembangan dan laporan mingguan anak"
        breadcrumbs={[
          { label: "Dashboard", href: "/parent", icon: IconHome },
        ]}
      />
      <MenuGrid>
        {availableMenus.map((menu, index) => (
          <MenuCard key={index} {...menu} />
        ))}
      </MenuGrid>
    </div>
  )
}
