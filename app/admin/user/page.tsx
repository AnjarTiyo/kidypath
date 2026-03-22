import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UserManagementPage } from "@/components/user/user-management-page"

export default async function AdminUserPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  return <UserManagementPage />
}