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

export type SemesterTopicPayload = {
  id?: string
  title: string
  description: string | null
  academicYear: string | null
  semesterNumber: number | null
}

interface SemesterTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic?: SemesterTopicPayload
  onSuccess: () => void
}

export function SemesterTopicDialog({ open, onOpenChange, topic, onSuccess }: SemesterTopicDialogProps) {
  const isEdit = !!topic?.id
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", description: "", academicYear: "", semesterNumber: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm({
        title: topic?.title ?? "",
        description: topic?.description ?? "",
        academicYear: topic?.academicYear ?? "",
        semesterNumber: topic?.semesterNumber?.toString() ?? "",
      })
      setErrors({})
      setServerError(null)
    }
  }, [open, topic])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = "Judul wajib diisi"
    if (!form.academicYear.trim()) e.academicYear = "Tahun akademik wajib diisi"
    if (!form.semesterNumber) e.semesterNumber = "Semester wajib dipilih"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      const url = isEdit ? `/api/semester-topics/${topic!.id}` : "/api/semester-topics"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          academicYear: form.academicYear.trim(),
          semesterNumber: Number(form.semesterNumber),
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
          <DialogTitle>{isEdit ? "Edit Topik Semester" : "Tambah Topik Semester"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="st-title">Judul <span className="text-destructive">*</span></Label>
            <Input
              id="st-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Aku Cinta Bumi"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="st-desc">Deskripsi</Label>
            <Textarea
              id="st-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi singkat topik..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-year">Tahun Akademik <span className="text-destructive">*</span></Label>
              <Input
                id="st-year"
                value={form.academicYear}
                onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                placeholder="2024/2025"
              />
              {errors.academicYear && <p className="text-xs text-destructive">{errors.academicYear}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Semester <span className="text-destructive">*</span></Label>
              <Select value={form.semesterNumber} onValueChange={(v) => setForm((f) => ({ ...f, semesterNumber: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
              {errors.semesterNumber && <p className="text-xs text-destructive">{errors.semesterNumber}</p>}
            </div>
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
