import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { StudentManagementPage } from "@/components/student/student-management-page"

export default async function AdminStudentPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    redirect("/unauthorized")
  }

  return <StudentManagementPage />
}