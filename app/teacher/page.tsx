import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function TeacherPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "teacher") {
    redirect("/unauthorized")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {session.user.name || session.user.email}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">My Classrooms</h2>
            <p className="text-sm text-muted-foreground">
              View and manage your classrooms
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Daily Assessments</h2>
            <p className="text-sm text-muted-foreground">
              Record student assessments
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Lesson Plans</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage lesson plans
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Activity Agenda</h2>
            <p className="text-sm text-muted-foreground">
              Plan daily activities
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Reports</h2>
            <p className="text-sm text-muted-foreground">
              Generate weekly and monthly reports
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Students</h2>
            <p className="text-sm text-muted-foreground">
              View student information
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
