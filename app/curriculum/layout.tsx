import { Navbar } from "@/components/layout/navbar"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-full bg-background">
        <Navbar />
        <div className="p-3 h-full sm:p-4 md:p-6 mx-auto space-y-4 sm:space-y-6 container max-w-7xl">
          {children}
        </div>
      </div>
    </AuthProvider>
  )
}