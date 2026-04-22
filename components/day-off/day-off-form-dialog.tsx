"use client"

import { useState, useEffect } from "react"
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
import { DayOff } from "./day-off-columns"
import { IconLoader2 } from "@tabler/icons-react"

interface DayOffFormDialogProps {
  dayOff?: DayOff
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DayOffFormDialog({ dayOff, open, onOpenChange, onSuccess }: DayOffFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ date: "", name: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!dayOff

  useEffect(() => {
    if (open) {
      setFormData({
        date: dayOff?.date ?? "",
        name: dayOff?.name ?? "",
      })
      setErrors({})
      setServerError(null)
    }
  }, [open, dayOff])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.date) newErrors.date = "Tanggal wajib diisi"
    if (!formData.name.trim()) newErrors.name = "Keterangan wajib diisi"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError(null)
    try {
      const url = isEdit ? `/api/day-offs/${dayOff!.id}` : "/api/day-offs"
      const method = isEdit ? "PATCH" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formData.date, name: formData.name.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setServerError(data.error || "Terjadi kesalahan")
        return
      }
      onSuccess?.()
      onOpenChange(false)
    } catch {
      setServerError("Terjadi kesalahan saat menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Hari Libur" : "Tambah Hari Libur"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah data hari libur yang sudah ada."
              : "Tambahkan hari libur baru ke kalender sekolah."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Keterangan</Label>
            <Input
              id="name"
              placeholder="cth. Hari Raya Idul Fitri"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {serverError && (
            <p className="text-sm text-destructive rounded-sm bg-destructive/10 px-3 py-2">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
