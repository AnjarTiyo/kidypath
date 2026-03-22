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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Classroom } from "./classroom-columns"
import { IconLoader2, IconChevronDown, IconX, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface ClassroomFormDialogProps {
  classroom?: Classroom
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Teacher {
  id: string
  name: string
}

export function ClassroomFormDialog({ 
  classroom, 
  open, 
  onOpenChange, 
  onSuccess 
}: ClassroomFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: classroom?.name || "",
    academicYear: classroom?.academicYear || "",
    teacherIds: classroom?.teacherIds || [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!classroom

  useEffect(() => {
    if (open) {
      setSearchQuery("")
      if (classroom) {
        setFormData({
          name: classroom.name,
          academicYear: classroom.academicYear,
          teacherIds: classroom.teacherIds || [],
        })
      } else {
        setFormData({
          name: "",
          academicYear: "",
          teacherIds: [],
        })
      }
      setErrors({})
    }
  }, [open, classroom])

  const fetchTeachers = async (search = "") => {
    try {
      setLoadingTeachers(true)
      const params = new URLSearchParams({ role: "teacher" })
      if (search) {
        params.append("search", search)
      }
      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setTeachers(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
    } finally {
      setLoadingTeachers(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (!popoverOpen) return
    
    const timer = setTimeout(() => {
      fetchTeachers(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, popoverOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nama kelas wajib diisi"
    }

    if (!formData.academicYear.trim()) {
      newErrors.academicYear = "Tahun ajaran wajib diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setLoading(true)

      const url = isEdit ? `/api/classrooms/${classroom.id}` : "/api/classrooms"
      const method = isEdit ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          academicYear: formData.academicYear,
          teacherIds: formData.teacherIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ submit: data.error || "Terjadi kesalahan" })
        return
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      setErrors({ submit: "Terjadi kesalahan saat menyimpan data" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Kelas" : "Tambah Kelas Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi kelas di bawah ini."
              : "Masukkan informasi kelas baru di bawah ini."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kelas <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Kelas A"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">
                Tahun Ajaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="academicYear"
                placeholder="Contoh: 2024/2025"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                disabled={loading}
              />
              {errors.academicYear && (
                <p className="text-sm text-destructive">{errors.academicYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teachers">Guru Kelas (Opsional)</Label>
              
              {/* Selected teachers badges */}
              {formData.teacherIds.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 border rounded-md">
                  {formData.teacherIds.map((teacherId) => {
                    const teacher = teachers.find(t => t.id === teacherId) || 
                      // Keep selected teachers even if they're not in current search results
                      classroom?.teachers.find(t => t.id === teacherId)
                    return teacher ? (
                      <Badge key={teacher.id} variant="secondary" className="gap-1">
                        {teacher.name}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              teacherIds: formData.teacherIds.filter(id => id !== teacherId)
                            })
                          }}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              )}

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="teachers"
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={loading}
                  >
                    <span className="text-muted-foreground">
                      {formData.teacherIds.length > 0
                        ? `${formData.teacherIds.length} guru dipilih`
                        : "Cari dan pilih guru kelas..."}
                    </span>
                    <IconChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Cari nama guru..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      {loadingTeachers ? (
                        <div className="flex items-center justify-center py-6">
                          <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Mencari...</span>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>
                            {searchQuery
                              ? "Tidak ada guru ditemukan."
                              : "Ketik untuk mencari guru..."}
                          </CommandEmpty>
                          <CommandGroup>
                            {teachers.map((teacher) => {
                              const isSelected = formData.teacherIds.includes(teacher.id)
                              return (
                                <CommandItem
                                  key={teacher.id}
                                  value={teacher.id}
                                  onSelect={() => {
                                    if (isSelected) {
                                      setFormData({
                                        ...formData,
                                        teacherIds: formData.teacherIds.filter(
                                          id => id !== teacher.id
                                        )
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        teacherIds: [...formData.teacherIds, teacher.id]
                                      })
                                    }
                                  }}
                                >
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50 [&_svg]:invisible"
                                    )}
                                  >
                                    <IconCheck className="h-4 w-4" />
                                  </div>
                                  <span>{teacher.name}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {errors.submit && (
              <div className="rounded-md bg-destructive/15 p-3">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}
          </div>

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
              {isEdit ? "Simpan Perubahan" : "Tambah Kelas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
