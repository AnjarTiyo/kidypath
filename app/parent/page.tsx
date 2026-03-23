import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function ParentPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "parent") {
    redirect("/unauthorized")
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Welcome, {session.user.name || session.user.email}
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/parent/report" className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow block">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Laporan Anak</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Lihat laporan perkembangan dan laporan mingguan anak
          </p>
        </Link>
        <div className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Activity Agenda</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View upcoming activities
          </p>
        </div>
      </div>
    </div>
  )
}
