import { Navbar } from "@/components/navbar"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        {children}
      </div>
    </AuthProvider>
  )
}
