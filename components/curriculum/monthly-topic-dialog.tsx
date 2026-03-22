"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconLoader2 } from "@tabler/icons-react"

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export type MonthlyTopicPayload = {
  id?: string
  title: string
  description: string | null
  monthNumber?: number | null
  semesterTopicId?: string
}

interface MonthlyTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semesterTopicId: string
  topic?: MonthlyTopicPayload
  onSuccess: () => void
}

export function MonthlyTopicDialog({ open, onOpenChange, semesterTopicId, topic, onSuccess }: MonthlyTopicDialogProps) {
  const isEdit = !!topic?.id
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", description: "", monthNumber: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm({
        title: topic?.title ?? "",
        description: topic?.description ?? "",
        monthNumber: topic?.monthNumber?.toString() ?? "",
      })
      setErrors({})
      setServerError(null)
    }
  }, [open, topic])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = "Judul wajib diisi"
    if (!form.monthNumber) e.monthNumber = "Bulan wajib dipilih"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      const url = isEdit ? `/api/monthly-topics/${topic!.id}` : "/api/monthly-topics"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          semesterTopicId,
          monthNumber: Number(form.monthNumber),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error ?? "Terjadi kesalahan"); return }
      onSuccess()
      onOpenChange(false)
    } catch {
      setServerError("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Topik Bulanan" : "Tambah Topik Bulanan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="mt-title">Judul <span className="text-destructive">*</span></Label>
            <Input
              id="mt-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Mengurangi Sampah Plastik"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mt-desc">Deskripsi</Label>
            <Textarea
              id="mt-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi singkat topik..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Bulan <span className="text-destructive">*</span></Label>
            <Select value={form.monthNumber} onValueChange={(v) => setForm((f) => ({ ...f, monthNumber: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.monthNumber && <p className="text-xs text-destructive">{errors.monthNumber}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
