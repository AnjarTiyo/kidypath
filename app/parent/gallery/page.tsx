import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconPhoto } from "@tabler/icons-react"
import { GalleryView } from "@/components/gallery/gallery-view"
import type { GalleryChild } from "@/app/api/parent/gallery/route"

async function fetchGallery(): Promise<GalleryChild[]> {
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const protocol = headersList.get("x-forwarded-proto") ?? "http"
  const cookie = headersList.get("cookie") ?? ""

  const res = await fetch(`${protocol}://${host}/api/parent/gallery`, {
    headers: { cookie },
    cache: "no-store",
  })

  if (!res.ok) return []
  return res.json()
}

export default async function ParentGalleryPage() {
  const session = await auth()

  if (!session?.user) redirect("/auth/login")
  if (session.user.role !== "parent") redirect("/unauthorized")

  const initialData = await fetchGallery()

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Galeri Ananda"
        description="Foto aktivitas anak selama di sekolah"
        breadcrumbs={[
          { label: "Beranda", href: "/parent", icon: IconHome },
          { label: "Galeri", icon: IconPhoto },
        ]}
      />
      <GalleryView initialData={initialData} />
    </div>
  )
}
