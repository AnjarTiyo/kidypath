"use client"

import { useState, useEffect } from "react"
import { IconUser, IconChalkboard, IconFileText, IconHome, IconChecklist } from "@tabler/icons-react"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CompactDateNavigation, LessonPlanCompactCard } from "@/components/assessment"
import { PageHeader } from "@/components/layout/page-header"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface LessonPlanData {
  id: string
  title: string
  code?: string
  generatedByAi?: boolean
  items: Array<{
    id: string
    developmentScope: string
    learningGoal: string
    activityContext: string
    generatedByAi?: boolean
  }>
}

export default function StudentAssessmentPage() {
  const { user, classrooms, loading } = useCurrentUser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [lessonPlans, setLessonPlans] = useState<LessonPlanData[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  // Fetch lesson plans for selected date
  useEffect(() => {
    // Don't fetch if still loading user data or no classrooms
    if (loading || classrooms.length === 0) {
      return
    }

    const abortController = new AbortController()

    const fetchLessonPlans = async () => {
      setLoadingPlans(true)
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const response = await fetch(`/api/lesson-plans?date=${dateStr}`, {
          signal: abortController.signal
        })

        if (response.ok) {
          const data = await response.json()
          setLessonPlans(data.data || [])
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error("Error fetching lesson plans:", error)
      } finally {
        setLoadingPlans(false)
      }
    }

    fetchLessonPlans()

    // Cleanup function to abort fetch on unmount or dependency change
    return () => {
      abortController.abort()
    }
  }, [selectedDate, classrooms.length, loading])

  // Show loading state
  if (loading) {
    return (
      <>
        <PageHeader
          title="Penilaian Peserta Didik"
          description="Memuat data..."
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Penilaian", href: "/teacher/assesment", icon: IconChecklist },
          ]}
        />
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    )
  }

  // Show warning if teacher has no assigned classrooms
  if (user?.role === "teacher" && classrooms.length === 0) {
    return (
      <>
        <PageHeader
          title="Penilaian Peserta Didik"
          description="Quick dashboard untuk melakukan penilaian peserta didik"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Penilaian", href: "/teacher/assesment", icon: IconChecklist },
          ]}
        />
        <div className="space-y-4">
          {/* Teacher & Class Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Guru {user?.name || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconChalkboard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tidak ada kelas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <svg
                  className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Belum Ada Rombongan Belajar
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Anda belum di-assign ke rombongan belajar manapun. Silakan hubungi admin untuk mendapatkan akses ke rombongan belajar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const handleAssessLessonPlan = (lessonPlanId: string) => {
    // Future implementation: Navigate to assessment page
    console.log("Assess lesson plan:", lessonPlanId)
  }

  const handleGenerateDailyJournal = () => {
    // Future implementation: Generate daily journal
    console.log("Generate daily journal for:", format(selectedDate, "yyyy-MM-dd"))
  }

  return (
    <>
      <div className="mb-4 space-y-1">
        <PageHeader
          title="Penilaian Peserta Didik"
          description="Quick dashboard untuk melakukan penilaian peserta didik"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Penilaian", href: "/teacher/assesment", icon: IconChecklist },
          ]}
        />
        <div className="flex items-center gap-2">
          <IconUser className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Guru {user?.name || "-"}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconChalkboard className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {classrooms.length > 0
              ? classrooms.map(c => c.name).join(", ")
              : "Tidak ada kelas"}
          </span>
        </div>
      </div>


      {/* Date Navigation */}
      <Card className="p-0">
        <CompactDateNavigation
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </Card>

      {/* Content Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Progres Penilaian</h2>
          <span className="text-xs text-muted-foreground">
            {format(selectedDate, "dd MMM yyyy")}
          </span>
        </div>

        {loadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : lessonPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lessonPlans.map((plan) => (
              <LessonPlanCompactCard
                key={plan.id}
                lessonPlan={plan}
                assessmentProgress={{
                  totalStudents: 25, // TODO: Get from API
                  assessedStudents: 0, // TODO: Get from API
                }}
                onAssess={() => handleAssessLessonPlan(plan.id)}
              />
            ))}

            {/* Daily Journal CTA - Future Implementation */}
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={handleGenerateDailyJournal}
                  disabled
                >
                  <IconFileText className="h-4 w-4 mr-2" />
                  Generate Jurnal Harian
                  <span className="ml-2 text-[10px] text-muted-foreground">(Segera Hadir)</span>
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Fitur ini akan merangkum semua penilaian hari ini
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Belum ada rencana pembelajaran untuk tanggal ini
                </p>
                <p className="text-xs text-muted-foreground">
                  Silakan buat rencana pembelajaran terlebih dahulu
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}