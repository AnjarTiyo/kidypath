import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { UserManagementPage } from "@/components/user/user-management-page"

export default async function AdminUserPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  return (
    <Suspense>
      <UserManagementPage />
    </Suspense>
  )
}