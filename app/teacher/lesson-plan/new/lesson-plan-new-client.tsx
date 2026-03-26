"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { LessonPlanBasicInfoCard } from "@/components/lesson-plan/lesson-plan-basic-info-card"
import { LessonPlanAgendaCard } from "@/components/lesson-plan/lesson-plan-agenda-card"
import { LessonPlanActivitiesCard } from "@/components/lesson-plan/lesson-plan-activities-card"
import { format, parse } from "date-fns"
import {
  IconHome,
  IconChalkboardTeacher,
  IconAlertCircle,
  IconArrowLeft
} from "@tabler/icons-react"
import { CurrentTopicsPayload, CurrentTopicsResponse } from "@/lib/types/current-topics"

type ActivityPhase =
  | "kegiatan_awal"
  | "kegiatan_inti"
  | "istirahat"
  | "kegiatan_penutup"
  | "refleksi"

const ACTIVITY_PHASES: ActivityPhase[] = [
  "kegiatan_awal",
  "kegiatan_inti",
  "istirahat",
  "kegiatan_penutup",
  "refleksi",
]

type DevelopmentScope =
  | "religious_moral"
  | "physical_motor"
  | "cognitive"
  | "language"
  | "social_emotional"
  | "art"

interface LessonPlanItem {
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface ActivityPhaseItem {
  phase: ActivityPhase
  description: string
  generatedByAi?: boolean
}

interface GeneratedLessonPlanResponse {
  items: Array<Pick<LessonPlanItem, "developmentScope" | "learningGoal" | "activityContext">>
  activities?: Array<{ phase: string; description: string }>
  materials?: string
}

interface Classroom {
  id: string
  name: string
  academicYear: string
}

export const lessonPlanBreadcrumbs = [
  { label: "Beranda", href: "/teacher", icon: IconHome },
  { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
  { label: "Buat Baru", href: "/teacher/lesson-plan/new", icon: IconChalkboardTeacher },
]

export default function LessonPlanNewPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, classrooms: userClassrooms, loading: loadingUser } = useCurrentUser()

  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedByAi, setGeneratedByAi] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentTopics, setCurrentTopics] = useState<CurrentTopicsPayload | null>(null)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topicsError, setTopicsError] = useState<string | null>(null)

  const developmentScopes: DevelopmentScope[] = [
    "religious_moral",
    "physical_motor",
    "cognitive",
    "language",
    "social_emotional",
    "art",
  ]

  const [formData, setFormData] = useState({
    classroomId: "",
    date: new Date(),
    topic: "",
    subtopic: "",
    code: "",
    ageGroup: "",
    materials: "",
    items: developmentScopes.map((scope) => ({
      developmentScope: scope,
      learningGoal: "",
      activityContext: "",
      generatedByAi: false,
    })),
    activities: ACTIVITY_PHASES.map((phase) => ({
      phase,
      description: "",
      generatedByAi: false,
    })) as ActivityPhaseItem[],
  })

  useEffect(() => {
    const dateParam = searchParams.get("date")
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date())
        setFormData((prev) => ({ ...prev, date: parsedDate }))
      } catch (error) {
        console.error("Invalid date parameter:", error)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchClassrooms()
    }
  }, [user])

  useEffect(() => {
    if (user?.role === "teacher" && userClassrooms.length > 0) {
      setClassrooms(userClassrooms)
      setLoadingClassrooms(false)

      if (userClassrooms.length === 1 && !formData.classroomId) {
        setFormData((prev) => ({ ...prev, classroomId: userClassrooms[0].id }))
      }
    }
  }, [user, userClassrooms, formData.classroomId])

  useEffect(() => {
    if (!formData.date) {
      setCurrentTopics(null)
      setTopicsError(null)
      return
    }

    const controller = new AbortController()
    const fetchCurrentTopics = async () => {
      setTopicsLoading(true)
      setTopicsError(null)

      try {
        const response = await fetch(
          `/api/current-topics?date=${format(formData.date, "yyyy-MM-dd")}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error ?? "Gagal memuat topik")
        }

        const data: CurrentTopicsResponse = await response.json()
        setCurrentTopics(data.data)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        setCurrentTopics(null)
        setTopicsError(error instanceof Error ? error.message : "Gagal memuat topik")
      } finally {
        setTopicsLoading(false)
      }
    }

    fetchCurrentTopics()
    return () => controller.abort()
  }, [formData.date])

  const fetchClassrooms = async () => {
    if (user?.role === "teacher") {
      setClassrooms(userClassrooms)
      setLoadingClassrooms(loadingUser)
      return
    }

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
      newErrors.topic = "Tema pembelajaran harus diisi"
    }

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

  const submitLessonPlan = async () => {
    if (!validate()) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: formData.classroomId,
          date: format(formData.date, "yyyy-MM-dd"),
          topic: formData.topic,
          subtopic: formData.subtopic || null,
          code: formData.code || null,
          materials: formData.materials || null,
          items: formData.items,
          activities: formData.activities.filter((a) => a.description.trim()),
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
      console.error("Error submitting lesson plan:", error)
      setErrors({ submit: "Terjadi kesalahan saat menyimpan data" })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitLessonPlan()
  }

  const handleGenerateWithAI = async (prompt?: string) => {
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
          userPrompt: prompt || "",
          ageGroup: formData.ageGroup,
          currentTopics,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate lesson plan")
      }

      const data: GeneratedLessonPlanResponse = await response.json()

      const updatedItems = developmentScopes.map((scope) => {
        const generatedItem = data.items.find((item) => item.developmentScope === scope)
        return {
          developmentScope: scope,
          learningGoal: generatedItem?.learningGoal || "",
          activityContext: generatedItem?.activityContext || "",
          generatedByAi: true,
        }
      })

      const updatedActivities = ACTIVITY_PHASES.map((phase) => {
        const generatedActivity = data.activities?.find((a) => a.phase === phase)
        return {
          phase,
          description: generatedActivity?.description || "",
          generatedByAi: true,
        }
      })

      setFormData({
        ...formData,
        items: updatedItems,
        activities: updatedActivities,
        materials: data.materials || formData.materials,
      })
      setGeneratedByAi(true)
    } catch (error) {
      console.error("Error generating content:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Terjadi kesalahan saat generate dengan AI" })
    } finally {
      setIsGenerating(false)
    }
  }

  const updateItem = (
    scope: DevelopmentScope,
    field: "learningGoal" | "activityContext",
    value: string
  ) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.developmentScope === scope ? { ...item, [field]: value } : item
      ),
    })
  }

  const updateActivity = (phase: ActivityPhase, value: string) => {
    setFormData({
      ...formData,
      activities: formData.activities.map((a) =>
        a.phase === phase ? { ...a, description: value } : a
      ),
    })
  }

  const updateMaterials = (value: string) => {
    setFormData({ ...formData, materials: value })
  }

  if (loadingUser) {
    return (
      <>
        <PageHeader
          title="Buat Rencana Pembelajaran Baru"
          description="Buat rencana pembelajaran komprehensif untuk semua aspek perkembangan"
          breadcrumbs={lessonPlanBreadcrumbs}
        />
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">Memuat data...</p>
          </CardContent>
        </Card>
      </>
    )
  }

  if (user?.role === "teacher" && classrooms.length === 0) {
    return (
      <>
        <PageHeader
          title="Buat Rencana Pembelajaran Baru"
          description="Buat rencana pembelajaran komprehensif untuk semua aspek perkembangan"
          breadcrumbs={lessonPlanBreadcrumbs}
        />
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <IconAlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Belum Ada Rombongan Belajar
                </h3>
                <p className="text-sm text-yellow-800">
                  Anda belum di-assign ke rombongan belajar manapun. Silakan hubungi admin untuk mendapatkan akses ke rombongan belajar.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/teacher/lesson-plan")}
                >
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Buat Rencana Pembelajaran Baru"
        description="Buat rencana pembelajaran komprehensif untuk semua aspek perkembangan"
        breadcrumbs={lessonPlanBreadcrumbs}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LessonPlanBasicInfoCard
            formData={{
              classroomId: formData.classroomId,
              date: formData.date,
              topic: formData.topic,
              subtopic: formData.subtopic,
              code: formData.code,
              ageGroup: formData.ageGroup,
            }}
            classrooms={classrooms}
            loadingClassrooms={loadingClassrooms}
            generatedByAi={generatedByAi}
            isGenerating={isGenerating}
            saving={saving}
            userRole={user?.role as "teacher" | "admin" | undefined}
            errors={errors}
            onFormChange={(data) => setFormData({ ...formData, ...data })}
            onGenerateWithAI={handleGenerateWithAI}
            onSave={submitLessonPlan}
            onCancel={() => router.push("/teacher/lesson-plan")}
            currentTopics={currentTopics}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
          />

          <LessonPlanAgendaCard
            items={formData.items}
            errors={errors}
            onItemChange={updateItem}
          />
        </div>

        <LessonPlanActivitiesCard
          activities={formData.activities}
          materials={formData.materials}
          isGenerating={isGenerating}
          onActivityChange={updateActivity}
          onMaterialsChange={updateMaterials}
        />

        {errors.submit && (
          <Card className="border-destructive">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-destructive">
                <IconAlertCircle className="h-4 w-4" />
                <p className="text-xs">{errors.submit}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </>
  )
}