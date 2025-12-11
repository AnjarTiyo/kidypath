"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export function Navbar() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="KidyPath Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-xl font-bold">KidyPath</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{session.user?.name || session.user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {session.user?.role}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
