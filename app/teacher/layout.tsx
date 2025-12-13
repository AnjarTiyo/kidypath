import { Navbar } from "@/components/layout/navbar"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-6 mx-auto space-y-6 container">
          {children}
        </div>
      </div>
    </AuthProvider>
  )
}
