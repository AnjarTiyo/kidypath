import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ParentPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "parent") {
    redirect("/unauthorized")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {session.user.name || session.user.email}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">My Children</h2>
            <p className="text-sm text-muted-foreground">
              View your children's information
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Daily Reports</h2>
            <p className="text-sm text-muted-foreground">
              View daily assessment reports
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Weekly Reports</h2>
            <p className="text-sm text-muted-foreground">
              Review weekly progress summaries
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Monthly Reports</h2>
            <p className="text-sm text-muted-foreground">
              Access monthly development reports
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Activity Agenda</h2>
            <p className="text-sm text-muted-foreground">
              View upcoming activities
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
