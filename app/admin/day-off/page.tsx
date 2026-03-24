import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DayOffManagementPage } from "@/components/day-off/day-off-management-page"

export default async function DayOffAdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  return <DayOffManagementPage />
}
