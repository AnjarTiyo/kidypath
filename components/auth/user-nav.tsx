"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function UserNav() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">
        {session.user?.email}
      </span>
      <Button 
        variant="outline" 
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
      >
        Sign out
      </Button>
    </div>
  )
}
