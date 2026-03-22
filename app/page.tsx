import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Redirect based on user role
  switch (session.user.role) {
    case "admin":
      redirect("/admin")
    case "teacher":
      redirect("/teacher")
    case "parent":
      redirect("/parent")
    default:
      redirect("/auth/login")
  }
}
