import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ClassroomManagementPage } from "@/components/classroom/classroom-management-page"

export default async function ClassroomAdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  return <ClassroomManagementPage />
}