import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Navbar } from "@/components/layout/navbar"
import { AuthProvider } from "@/components/auth/auth-provider"

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 max-w-3xl">{children}</main>
      </div>
    </AuthProvider>
  )
}
