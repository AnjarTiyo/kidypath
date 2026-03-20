"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { LessonPlanBasicInfoCard } from "@/components/lesson-plan/lesson-plan-basic-info-card"
import { LessonPlanAgendaCard } from "@/components/lesson-plan/lesson-plan-agenda-card"
import { format, parse } from "date-fns"
import { 
  IconHome, 
  IconChalkboardTeacher,
  IconAlertCircle,
  IconArrowLeft
} from "@tabler/icons-react"

type DevelopmentScope = 'religious_moral' | 'physical_motor' | 'cognitive' | 'language' | 'social_emotional' | 'art';

interface LessonPlanItem {
  developmentScope: DevelopmentScope
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface GeneratedLessonPlanResponse {
  items: Array<Pick<LessonPlanItem, "developmentScope" | "learningGoal" | "activityContext">>
}

interface Classroom {
  id: string
  name: string
  academicYear: string
}

export default function NewLessonPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, classrooms: userClassrooms, loading: loadingUser } = useCurrentUser()
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedByAi, setGeneratedByAi] = useState(false)
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

  // Set initial date from URL params
  useEffect(() => {
    const dateParam = searchParams.get("date")
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date())
        setFormData(prev => ({ ...prev, date: parsedDate }))
      } catch (error) {
        console.error("Invalid date parameter:", error)
      }
    }
  }, [searchParams])

  // Fetch classrooms when component mounts
  useEffect(() => {
    if (user) {
      fetchClassrooms()
    }
  }, [user])

  // Set classrooms from hook data for teachers
  useEffect(() => {
    if (user?.role === "teacher" && userClassrooms.length > 0) {
      setClassrooms(userClassrooms)
      setLoadingClassrooms(false)
      
      // Auto-select the first (and likely only) classroom for teachers
      if (userClassrooms.length === 1 && !formData.classroomId) {
        setFormData(prev => ({ ...prev, classroomId: userClassrooms[0].id }))
      }
    }
  }, [user, userClassrooms, formData.classroomId])

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
    // Validate topic before generating
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
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate lesson plan")
      }

      const data: GeneratedLessonPlanResponse = await response.json()
      
      // Map generated items to form data
      const updatedItems = developmentScopes.map(scope => {
        const generatedItem = data.items.find((item) => item.developmentScope === scope)
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

  // Show loading state
  if (loadingUser) {
    return (
      <>
        <PageHeader
          title="Buat Rencana Pembelajaran Baru"
          description="Buat rencana pembelajaran komprehensif untuk semua aspek perkembangan"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
            { label: "Buat Baru", href: "/teacher/lesson-plan/new", icon: IconChalkboardTeacher },
          ]}
        />
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">Memuat data...</p>
          </CardContent>
        </Card>
      </>
    )
  }

  // Show warning if teacher has no assigned classrooms
  if (user?.role === "teacher" && classrooms.length === 0) {
    return (
      <>
        <PageHeader
          title="Buat Rencana Pembelajaran Baru"
          description="Buat rencana pembelajaran komprehensif untuk semua aspek perkembangan"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
            { label: "Buat Baru", href: "/teacher/lesson-plan/new", icon: IconChalkboardTeacher },
          ]}
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
        breadcrumbs={[
          { label: "Beranda", href: "/teacher", icon: IconHome },
          { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
          { label: "Buat Baru", href: "/teacher/lesson-plan/new", icon: IconChalkboardTeacher },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 2 Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Basic Information */}
          <LessonPlanBasicInfoCard
            formData={{
              classroomId: formData.classroomId,
              date: formData.date,
              topic: formData.topic,
              subtopic: formData.subtopic,
              code: formData.code,
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
          />

          {/* Right Column: Detailed Agenda */}
          <LessonPlanAgendaCard
            items={formData.items}
            errors={errors}
            onItemChange={updateItem}
          />
        </div>

        {/* Error Message */}
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
