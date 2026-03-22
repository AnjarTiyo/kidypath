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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Welcome, {session.user.name || session.user.email}
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">My Children</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View your children&apos;s information
          </p>
        </div>
        <div className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Daily Reports</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View daily assessment reports
          </p>
        </div>
        <div className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Weekly Reports</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review weekly progress summaries
          </p>
        </div>
        <div className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Monthly Reports</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Access monthly development reports
          </p>
        </div>
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
