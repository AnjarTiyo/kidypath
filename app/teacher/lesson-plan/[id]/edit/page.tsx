"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getDevelopmentScopeLabel } from "@/lib/ai/lesson-plan-generator"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { 
  IconHome, 
  IconChalkboardTeacher, 
  IconCalendar, 
  IconSparkles, 
  IconDeviceFloppy,
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

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

export default function EditLessonPlanPage() {
  const router = useRouter()
  const params = useParams()
  const lessonPlanId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [generatedByAi, setGeneratedByAi] = useState(false)
  const [activeTab, setActiveTab] = useState<DevelopmentScope>('religious_moral')
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  // Fetch lesson plan data
  useEffect(() => {
    if (lessonPlanId) {
      fetchLessonPlan()
    }
  }, [lessonPlanId])

  const fetchLessonPlan = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}`)
      if (response.ok) {
        const data = await response.json()
        setLessonPlan(data)
        setFormData({
          classroomId: data.classroomId,
          date: new Date(data.date),
          topic: data.topic || "",
          subtopic: data.subtopic || "",
          code: data.code || "",
          items: data.items && data.items.length > 0 
            ? data.items.map((item: LessonPlanItem) => ({
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
        setGeneratedByAi(data.generatedByAi || false)
      } else {
        setErrors({ fetch: "Gagal memuat data rencana pembelajaran" })
      }
    } catch (error) {
      console.error("Error fetching lesson plan:", error)
      setErrors({ fetch: "Terjadi kesalahan saat memuat data" })
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.topic.trim()) {
      newErrors.topic = "Tema pembelajaran harus diisi"
    }

    // Validate all items
    formData.items.forEach((item) => {
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

    if (!validate()) {
      const firstErrorKey = Object.keys(errors)[0]
      if (firstErrorKey.startsWith('goal_') || firstErrorKey.startsWith('activity_')) {
        const scope = firstErrorKey.split('_')[1]
        setActiveTab(scope as DevelopmentScope)
      }
      return
    }

    setSaving(true)

    try {
    const response = await fetch(`/api/lesson-plans/${lessonPlanId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: format(formData.date, "yyyy-MM-dd"),
        topic: formData.topic,
        subtopic: formData.subtopic || null,
        code: formData.code || null,
        items: formData.items,
        generatedByAi: generatedByAi,
      }),
    })

      if (response.ok) {
        router.push("/teacher/lesson-plan")
        router.refresh()
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Terjadi kesalahan" })
      }
    } catch (error) {
      console.error("Error updating lesson plan:", error)
      setErrors({ submit: "Terjadi kesalahan saat menyimpan data" })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!formData.topic.trim()) {
      setErrors({ topic: "Tema harus diisi terlebih dahulu untuk generate dengan AI" })
      return
    }

    setIsGenerating(true)
    setErrors({})

    try {
      const response = await fetch("/api/lesson-plans/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          subtopic: formData.subtopic,
          userPrompt: "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate lesson plan")
      }

      const data = await response.json()
      
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

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Rencana Pembelajaran"
          description="Perbarui rencana pembelajaran"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
            { label: "Edit", href: `/teacher/lesson-plan/${lessonPlanId}/edit`, icon: IconChalkboardTeacher },
          ]}
        />
        <Card>
          <CardContent className="py-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </>
    )
  }

  if (errors.fetch || !lessonPlan) {
    return (
      <>
        <PageHeader
          title="Edit Rencana Pembelajaran"
          description="Perbarui rencana pembelajaran"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
            { label: "Edit", href: `/teacher/lesson-plan/${id}/edit`, icon: IconChalkboardTeacher },
          ]}
        />
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <IconAlertCircle className="h-5 w-5" />
              <p className="text-sm">{errors.fetch || "Rencana pembelajaran tidak ditemukan"}</p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/teacher/lesson-plan")}
            >
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Edit Rencana Pembelajaran"
        description="Perbarui rencana pembelajaran dengan 6 aspek perkembangan"
        breadcrumbs={[
          { label: "Beranda", href: "/teacher", icon: IconHome },
          { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
          { label: "Edit", href: `/teacher/lesson-plan/${lessonPlanId}/edit`, icon: IconChalkboardTeacher },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Informasi Dasar
              {generatedByAi && (
                <Badge variant="secondary" className="text-xs">
                  <IconSparkles className="mr-1 h-3 w-3" />
                  AI Generated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Informasi umum tentang rencana pembelajaran
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Classroom (Read-only) */}
            <div className="space-y-2">
              <Label>Rombongan Belajar</Label>
              <Input
                value={lessonPlan.classroomName || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Rombongan belajar tidak dapat diubah</p>
            </div>

            <Separator />

            {/* Date */}
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
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
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
            </div>

            <Separator />

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
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Generation Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconSparkles className="h-5 w-5 text-primary" />
              Regenerate dengan AI
            </CardTitle>
            <CardDescription>
              Regenerate semua aspek perkembangan dengan AI (akan menimpa data yang ada)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !formData.topic.trim()}
              variant="default"
              size="lg"
            >
              {isGenerating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              <IconSparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Regenerate AI"}
            </Button>
          </CardContent>
        </Card>

        {/* Development Scopes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Aspek Perkembangan</CardTitle>
            <CardDescription>
              Perbarui tujuan pembelajaran dan aktivitas untuk setiap aspek perkembangan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as DevelopmentScope)}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto mb-4">
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
                  <TabsContent key={scope} value={scope} className="space-y-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{getDevelopmentScopeLabel(scope)}</h3>
                      {item.generatedByAi && (
                        <Badge variant="secondary" className="text-xs">
                          <IconSparkles className="mr-1 h-3 w-3" />
                          AI Generated
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`goal-${scope}`}>
                          Tujuan Pembelajaran <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id={`goal-${scope}`}
                          placeholder="Contoh: Anak mampu mengenal dan menyebutkan 5 jenis hewan..."
                          value={item.learningGoal}
                          onChange={(e) => updateItem(scope, 'learningGoal', e.target.value)}
                          rows={4}
                          className="resize-none"
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
                          rows={5}
                          className="resize-none"
                        />
                        {errors[`activity_${scope}`] && (
                          <p className="text-sm text-destructive">{errors[`activity_${scope}`]}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <IconAlertCircle className="h-5 w-5" />
                <p className="text-sm">{errors.submit}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border rounded-lg shadow-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/teacher/lesson-plan")}
            disabled={saving}
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button
            type="submit"
            disabled={saving}
            size="lg"
          >
            {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Perbarui Rencana Pembelajaran"}
          </Button>
        </div>
      </form>
    </>
  )
}
