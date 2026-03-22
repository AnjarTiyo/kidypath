"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes instead of default
      refetchOnWindowFocus={false} // Disable refetch on window focus to reduce requests
    >
      {children}
    </SessionProvider>
  )
}
