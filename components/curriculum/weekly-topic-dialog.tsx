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

export type WeeklyTopicPayload = {
  id?: string
  title: string
  description: string | null
  weekNumber?: number | null
  monthlyTopicId?: string
}

interface WeeklyTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  monthlyTopicId: string
  topic?: WeeklyTopicPayload
  onSuccess: () => void
}

export function WeeklyTopicDialog({ open, onOpenChange, monthlyTopicId, topic, onSuccess }: WeeklyTopicDialogProps) {
  const isEdit = !!topic?.id
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", description: "", weekNumber: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm({
        title: topic?.title ?? "",
        description: topic?.description ?? "",
        weekNumber: topic?.weekNumber?.toString() ?? "",
      })
      setErrors({})
      setServerError(null)
    }
  }, [open, topic])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = "Judul wajib diisi"
    if (!form.weekNumber) e.weekNumber = "Minggu wajib dipilih"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      const url = isEdit ? `/api/weekly-topics/${topic!.id}` : "/api/weekly-topics"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          monthlyTopicId,
          weekNumber: Number(form.weekNumber),
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
          <DialogTitle>{isEdit ? "Edit Topik Mingguan" : "Tambah Topik Mingguan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="wt-title">Judul <span className="text-destructive">*</span></Label>
            <Input
              id="wt-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Dampak Sampah Plastik di Laut"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wt-desc">Deskripsi</Label>
            <Textarea
              id="wt-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi singkat topik..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Minggu <span className="text-destructive">*</span></Label>
            <Select value={form.weekNumber} onValueChange={(v) => setForm((f) => ({ ...f, weekNumber: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih minggu" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <SelectItem key={w} value={String(w)}>Minggu {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.weekNumber && <p className="text-xs text-destructive">{errors.weekNumber}</p>}
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
