import { auth } from "@/auth"
import { StudentDetailPage } from "@/components/student/student-detail-page"
import { redirect } from "next/navigation"

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin" && session.user.role !== "teacher" && !session.user.isCurriculumCoordinator) {
    redirect("/unauthorized")
  }

  return <StudentDetailPage studentId={id} />
}
