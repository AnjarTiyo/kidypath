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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Student } from "./student-columns"
import { IconLoader2 } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { IconX } from "@tabler/icons-react"

interface StudentFormDialogProps {
  student?: Student
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Classroom {
  id: string
  name: string
}

interface Parent {
  id: string
  name: string | null
  email: string | null
}

export function StudentFormDialog({ 
  student, 
  open, 
  onOpenChange, 
  onSuccess 
}: StudentFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [formData, setFormData] = useState({
    fullName: student?.fullName || "",
    birthDate: student?.birthDate || "",
    gender: student?.gender || "",
    classroomId: student?.classroomId || "",
    parentIds: student?.parents?.map(p => p.id) || [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!student

  // Fetch classrooms and parents
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classroomsRes, parentsRes] = await Promise.all([
          fetch("/api/classrooms?pageSize=100"),
          fetch("/api/users?role=parent&pageSize=100"),
        ])

        if (classroomsRes.ok) {
          const classroomsData = await classroomsRes.json()
          setClassrooms(classroomsData.data || [])
        }

        if (parentsRes.ok) {
          const parentsData = await parentsRes.json()
          setParents(parentsData.data || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        fullName: student?.fullName || "",
        birthDate: student?.birthDate || "",
        gender: student?.gender || "",
        classroomId: student?.classroomId || "",
        parentIds: student?.parents?.map(p => p.id) || [],
      })
      setErrors({})
    }
  }, [open, student])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = isEdit ? `/api/students/${student.id}` : "/api/students"
      const method = isEdit ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          classroomId: formData.classroomId || null,
          birthDate: formData.birthDate || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error) {
          setErrors({ general: data.error })
        }
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error saving student:", error)
      setErrors({ general: "Terjadi kesalahan. Silakan coba lagi." })
    } finally {
      setLoading(false)
    }
  }

  const toggleParent = (parentId: string) => {
    setFormData(prev => ({
      ...prev,
      parentIds: prev.parentIds.includes(parentId)
        ? prev.parentIds.filter(id => id !== parentId)
        : [...prev.parentIds, parentId]
    }))
  }

  const selectedParents = parents.filter(p => formData.parentIds.includes(p.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Siswa" : "Tambah Siswa Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Perbarui informasi siswa di bawah ini." 
              : "Masukkan informasi siswa baru di bawah ini."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">
              Jenis Kelamin <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Laki-laki</SelectItem>
                <SelectItem value="female">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Classroom */}
          <div className="space-y-2">
            <Label htmlFor="classroom">Kelas</Label>
            <Select
              value={formData.classroomId || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, classroomId: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ada kelas</SelectItem>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parents */}
          <div className="space-y-2">
            <Label>Orang Tua</Label>
            <div className="rounded-sm border p-3 space-y-2">
              {selectedParents.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedParents.map(parent => (
                    <Badge key={parent.id} variant="secondary">
                      {parent.name || parent.email}
                      <button
                        type="button"
                        onClick={() => toggleParent(parent.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Select
                onValueChange={(value) => {
                  if (value && !formData.parentIds.includes(value)) {
                    toggleParent(value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih orang tua" />
                </SelectTrigger>
                <SelectContent>
                  {parents
                    .filter(p => !formData.parentIds.includes(p.id))
                    .map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name || parent.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {parents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada orang tua terdaftar
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Siswa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
