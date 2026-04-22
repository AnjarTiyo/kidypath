"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticate } from "@/app/auth/login/actions"
import { IconEye, IconEyeOff, IconLoader, IconLogin } from "@tabler/icons-react"
import { Badge } from "../ui/badge"
import { version } from "@/package.json"

export function LoginForm() {
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

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
        <CardTitle className="text-xl sm:text-2xl">Login KidyPath</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Halo, Guru Hebat! Masukkan username/nomor HP dan password Anda untuk lanjut berbagi keceriaan di Kidy Path.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col w-full">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="identifier" className="text-sm">Username / No. HP</Label>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="email@contoh.com atau 08123456789"
              required
              disabled={isPending}
              className="h-10 sm:h-11"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={isPending}
                className="h-10 sm:h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                disabled={isPending}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <IconEyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <IconEye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-xs sm:text-sm text-red-500 p-2 bg-red-50 rounded-sm">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isPending}>
            {isPending ? <IconLoader className="animate-spin h-4 w-4 sm:h-5 sm:w-5" /> : <IconLogin className="h-4 w-4 sm:h-5 sm:w-5" />}
            {isPending ? "Loading..." : "Masuk"}
          </Button>
        </form>
        <span className="pt-4 text-[10px] text-muted-foreground italic text-center w-full">Versi v{version}</span>
      </CardContent>
    </Card>
  )
}
