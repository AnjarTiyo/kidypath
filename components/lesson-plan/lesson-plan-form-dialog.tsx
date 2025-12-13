"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "../ui/textarea"
import { IconSparkles } from "@tabler/icons-react"

interface LessonPlan {
  id: string
  classroomId: string
  classroomName?: string
  date: string
  title: string | null
  code?: string | null
  content: string | null
  generatedByAi?: boolean
}

interface Classroom {
  id: string
  name: string
  academicYear: string
}

interface LessonPlanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonPlan?: LessonPlan | null
  selectedDate?: Date
  onSuccess: () => void
}

export function LessonPlanFormDialog({
  open,
  onOpenChange,
  lessonPlan,
  selectedDate,
  onSuccess,
}: LessonPlanFormDialogProps) {
  const { user, classrooms: userClassrooms, loading: loadingUser } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)

  const [formData, setFormData] = useState({
    classroomId: "",
    date: selectedDate || new Date(),
    title: "",
    code: "",
    content: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch classrooms when dialog opens
  useEffect(() => {
    if (open && !lessonPlan && user) {
      fetchClassrooms()
    }
  }, [open, lessonPlan, user])

  // Set initial form data
  useEffect(() => {
    if (lessonPlan) {
      setFormData({
        classroomId: lessonPlan.classroomId,
        date: new Date(lessonPlan.date),
        title: lessonPlan.title || "",
        code: lessonPlan.code || "",
        content: lessonPlan.content || "",
      })
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate,
      }))
    }
  }, [lessonPlan, selectedDate])

  // Set classrooms from hook data for teachers
  useEffect(() => {
    if (user?.role === "teacher" && userClassrooms.length > 0) {
      setClassrooms(userClassrooms)
      setLoadingClassrooms(false)
    }
  }, [user, userClassrooms])

  const fetchClassrooms = async () => {
    // For teachers, use classrooms from the hook
    if (user?.role === "teacher") {
      setClassrooms(userClassrooms)
      setLoadingClassrooms(loadingUser)
      return
    }

    // For admins, fetch all classrooms
    setLoadingClassrooms(true)
    try {
      const response = await fetch("/api/classrooms?pageSize=100")
      if (response.ok) {
        const data = await response.json()
        setClassrooms(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error)
    } finally {
      setLoadingClassrooms(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.classroomId) {
      newErrors.classroomId = "Rombongan belajar harus dipilih"
    }
    if (!formData.date) {
      newErrors.date = "Tanggal harus dipilih"
    }
    if (!formData.title.trim()) {
      newErrors.title = "Judul rencana pembelajaran harus diisi"
    }
    if (!formData.content.trim()) {
      newErrors.content = "Konten rencana pembelajaran harus diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    try {
      const url = lessonPlan
        ? `/api/lesson-plans/${lessonPlan.id}`
        : "/api/lesson-plans"

      const method = lessonPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: formData.classroomId,
          date: format(formData.date, "yyyy-MM-dd"),
          title: formData.title,
          code: formData.code || null,
          content: formData.content,
          generatedByAi: false,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Terjadi kesalahan" })
      }
    } catch (error) {
      console.error("Error submitting lesson plan:", error)
      setErrors({ submit: "Terjadi kesalahan saat menyimpan data" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      classroomId: "",
      date: new Date(),
      title: "",
      code: "",
      content: "",
    })
    setErrors({})
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {lessonPlan ? "Edit Rencana Pembelajaran" : "Buat Rencana Pembelajaran"}
            </DialogTitle>
            <DialogDescription>
              {lessonPlan
                ? "Perbarui rencana pembelajaran yang sudah ada"
                : "Buat rencana pembelajaran baru untuk rombongan belajar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning for teachers with no classrooms */}
            {user?.role === "teacher" && !loadingUser && classrooms.length === 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Belum Ada Rombongan Belajar
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Anda belum di-assign ke rombongan belajar manapun. Hubungi admin untuk
                        mendapatkan akses ke rombongan belajar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="classroom">
                  Rombongan Belajar <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.classroomId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classroomId: value })
                  }
                  disabled={!!lessonPlan || loadingClassrooms || (user?.role === "teacher" && classrooms.length === 0)}
                >
                  <SelectTrigger id="classroom" className="w-full">
                    <SelectValue placeholder="Pilih rombongan belajar" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClassrooms ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Memuat...
                      </div>
                    ) : classrooms.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Tidak ada rombongan belajar
                      </div>
                    ) : (
                      classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.name} - {classroom.academicYear}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.classroomId && (
                  <p className="text-sm text-destructive">{errors.classroomId}</p>
                )}
              </div>
              {/* Code (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  Kode (Opsional)
                </Label>
                <input
                  id="code"
                  type="text"
                  placeholder="Contoh: LP-001 atau tema pembelajaran"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code}</p>
                )}
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>
                Tanggal <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                    disabled={!!lessonPlan}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP", { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, date })
                    }
                    locale={id}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Rencana Pembelajaran <span className="text-destructive">*</span>
              </Label>
              <input
                id="title"
                type="text"
                placeholder="Contoh: Mengenal Hewan dan Tumbuhan"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>



            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">
                  Konten Rencana Pembelajaran <span className="text-destructive">*</span>
                </Label>
                <Button
                  size={"sm"}
                  variant={"outline"}
                >
                  <IconSparkles className="mr-2 h-4 w-4" />
                  Buat dengan AI
                </Button>
              </div>
              <Textarea
                id="content"
                placeholder="Masukkan rencana pembelajaran..."
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={10}
                className="resize-none"
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>

            {errors.submit && (
              <p className="text-sm text-destructive">{errors.submit}</p>
            )}
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
            <Button
              type="submit"
              disabled={loading || (user?.role === "teacher" && classrooms.length === 0)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lessonPlan ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
