"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticate } from "@/app/auth/login/actions"

export function LoginForm() {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)
    
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await authenticate(formData)
      if (result) {
        setError(result)
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 sm:space-y-2">
        <CardTitle className="text-xl sm:text-2xl">Login</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Gunakan email dan password akun Anda untuk masuk ke Kidy Path.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={isPending}
              className="h-10 sm:h-11"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              className="h-10 sm:h-11"
            />
          </div>
          {error && (
            <div className="text-xs sm:text-sm text-red-500 p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isPending}>
            {isPending ? "Loading..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
