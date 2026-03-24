"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "./user-columns"

interface ResetPasswordDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    if (password.length < 6) {
      setErrors({ password: "Password harus minimal 6 karakter" })
      return
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Password tidak cocok" })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || "Gagal mereset password" })
        return
      }

      setSuccess(true)
      setPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
      }, 1500)
    } catch {
      setErrors({ general: "Terjadi kesalahan. Silakan coba lagi." })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("")
      setConfirmPassword("")
      setErrors({})
      setSuccess(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Atur password baru untuk <span className="font-medium">{user.name || user.email}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errors.general && (
              <div className="text-sm text-destructive">{errors.general}</div>
            )}
            {success && (
              <div className="text-sm text-green-600">Password berhasil direset.</div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="new-password">Password Baru *</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              {errors.password && (
                <span className="text-sm text-destructive">{errors.password}</span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Konfirmasi Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {errors.confirmPassword && (
                <span className="text-sm text-destructive">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
