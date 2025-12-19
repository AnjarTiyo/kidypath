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
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDevelopmentScopeLabel } from "@/lib/ai/lesson-plan-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

type DevelopmentScope = 'religious_moral' | 'physical_motor' | 'cognitive' | 'language' | 'social_emotional' | 'art';

interface LessonPlanItem {
  id?: string
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface LessonPlan {
  id: string
  classroomId: string
  classroomName?: string
  date: string
  topic: string
  subtopic?: string | null
  code?: string | null
  generatedByAi?: boolean
  items: LessonPlanItem[]
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

  const developmentScopes: DevelopmentScope[] = [
    'religious_moral',
    'physical_motor',
    'cognitive',
    'language',
    'social_emotional',
    'art'
  ]

  const [formData, setFormData] = useState({
    classroomId: "",
    date: selectedDate || new Date(),
    topic: "",
    subtopic: "",
    code: "",
    items: developmentScopes.map(scope => ({
      developmentScope: scope,
      learningGoal: "",
      activityContext: "",
      generatedByAi: false,
    })),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<DevelopmentScope>('religious_moral')
  
  // AI generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedByAi, setGeneratedByAi] = useState(false)

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
        topic: lessonPlan.topic || "",
        subtopic: lessonPlan.subtopic || "",
        code: lessonPlan.code || "",
        items: lessonPlan.items && lessonPlan.items.length > 0 
          ? lessonPlan.items.map(item => ({
              ...item,
              generatedByAi: item.generatedByAi || false,
            }))
          : developmentScopes.map(scope => ({
              developmentScope: scope,
              learningGoal: "",
              activityContext: "",
              generatedByAi: false,
            })),
      })
      setGeneratedByAi(lessonPlan.generatedByAi || false)
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
    if (!formData.topic.trim()) {
      newErrors.topic = "Tema rencana pembelajaran harus diisi"
    }

    // Validate all items
    formData.items.forEach((item, index) => {
      if (!item.learningGoal.trim()) {
        newErrors[`goal_${item.developmentScope}`] = "Tujuan pembelajaran harus diisi"
      }
      if (!item.activityContext.trim()) {
        newErrors[`activity_${item.developmentScope}`] = "Konteks/aktivitas harus diisi"
      }
    })

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
          topic: formData.topic,
          subtopic: formData.subtopic || null,
          code: formData.code || null,
          items: formData.items,
          generatedByAi: generatedByAi,
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
      topic: "",
      subtopic: "",
      code: "",
      items: developmentScopes.map(scope => ({
        developmentScope: scope,
        learningGoal: "",
        activityContext: "",
        generatedByAi: false,
      })),
    })
    setErrors({})
    setGeneratedByAi(false)
    setActiveTab('religious_moral')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleGenerateWithAI = async () => {
    // Validate topic before generating
    if (!formData.topic.trim()) {
      setErrors({ topic: "Tema harus diisi terlebih dahulu untuk generate dengan AI" })
      return
    }

    setIsGenerating(true)
    setErrors({})

    try {
      // Call the API endpoint to generate lesson plan
      const response = await fetch("/api/lesson-plans/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          subtopic: formData.subtopic,
          userPrompt: "", // Can be extended to accept user preferences
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate lesson plan")
      }

      const data = await response.json()
      
      // Map generated items to form data
      const updatedItems = developmentScopes.map(scope => {
        const generatedItem = data.items.find((item: any) => item.developmentScope === scope)
        return {
          developmentScope: scope,
          learningGoal: generatedItem?.learningGoal || "",
          activityContext: generatedItem?.activityContext || "",
          generatedByAi: true,
        }
      })

      setFormData({
        ...formData,
        items: updatedItems,
      })
      setGeneratedByAi(true)
    } catch (error) {
      console.error("Error generating content:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Terjadi kesalahan saat generate dengan AI" })
    } finally {
      setIsGenerating(false)
    }
  }

  const updateItem = (scope: DevelopmentScope, field: 'learningGoal' | 'activityContext', value: string) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.developmentScope === scope
          ? { ...item, [field]: value }
          : item
      ),
    })
  }

  const getItem = (scope: DevelopmentScope) => {
    return formData.items.find(item => item.developmentScope === scope) || {
      developmentScope: scope,
      learningGoal: "",
      activityContext: "",
      generatedByAi: false,
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lessonPlan ? "Edit Rencana Pembelajaran" : "Buat Rencana Pembelajaran"}
              {generatedByAi && (
                <Badge variant="secondary" className="text-xs">
                  <IconSparkles className="mr-1 h-3 w-3" />
                  AI Generated
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {lessonPlan
                ? "Perbarui rencana pembelajaran dengan 6 aspek perkembangan"
                : "Buat rencana pembelajaran baru untuk semua aspek perkembangan"}
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
            </div>

            {/* Topic & Subtopic */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topic">
                  Tema Pembelajaran <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="Contoh: Mengenal Hewan dan Tumbuhan"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                />
                {errors.topic && (
                  <p className="text-sm text-destructive">{errors.topic}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtopic">Sub Tema (Opsional)</Label>
                <Input
                  id="subtopic"
                  type="text"
                  placeholder="Contoh: Hewan Peliharaan"
                  value={formData.subtopic}
                  onChange={(e) =>
                    setFormData({ ...formData, subtopic: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Kode (Opsional)</Label>
              <Input
                id="code"
                type="text"
                placeholder="Contoh: LP-001"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>

            {/* AI Generate Button */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Generate dengan AI</p>
                <p className="text-xs text-muted-foreground">
                  AI akan membuat tujuan dan aktivitas untuk semua 6 aspek perkembangan
                </p>
              </div>
              <Button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !formData.topic.trim()}
                size="sm"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <IconSparkles className="mr-2 h-4 w-4" />
                Generate AI
              </Button>
            </div>

            {/* Development Scopes Tabs */}
            <div className="space-y-2">
              <Label>
                Aspek Perkembangan <span className="text-destructive">*</span>
              </Label>
              <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as DevelopmentScope)}>
                <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto">
                  {developmentScopes.map((scope) => (
                    <TabsTrigger
                      key={scope}
                      value={scope}
                      className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {getDevelopmentScopeLabel(scope).split(' ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {developmentScopes.map((scope) => {
                  const item = getItem(scope)
                  return (
                    <TabsContent key={scope} value={scope} className="space-y-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{getDevelopmentScopeLabel(scope)}</h3>
                            {item.generatedByAi && (
                              <Badge variant="secondary" className="text-xs">
                                <IconSparkles className="mr-1 h-3 w-3" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            Isi tujuan pembelajaran dan aktivitas untuk aspek ini
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`goal-${scope}`}>
                              Tujuan Pembelajaran <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              id={`goal-${scope}`}
                              placeholder="Contoh: Anak mampu mengenal dan menyebutkan 5 jenis hewan..."
                              value={item.learningGoal}
                              onChange={(e) => updateItem(scope, 'learningGoal', e.target.value)}
                              rows={3}
                            />
                            {errors[`goal_${scope}`] && (
                              <p className="text-sm text-destructive">{errors[`goal_${scope}`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`activity-${scope}`}>
                              Konteks/Aktivitas <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              id={`activity-${scope}`}
                              placeholder="Contoh: Anak mengamati gambar hewan, menyebutkan namanya, dan menirukan suaranya..."
                              value={item.activityContext}
                              onChange={(e) => updateItem(scope, 'activityContext', e.target.value)}
                              rows={4}
                            />
                            {errors[`activity_${scope}`] && (
                              <p className="text-sm text-destructive">{errors[`activity_${scope}`]}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )
                })}
              </Tabs>
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
