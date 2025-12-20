"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import LessonPlanCalendar from "@/components/lesson-plan/lesson-plan-calendar"
import DetailLessonPlan from "@/components/lesson-plan/detail-lesson-plan"
import { IconChalkboardTeacher, IconHome, IconNoteOff } from "@tabler/icons-react"
import { format } from "date-fns"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"

type DevelopmentScope = 'religious_moral' | 'physical_motor' | 'cognitive' | 'language' | 'social_emotional' | 'art';

interface LessonPlanItem {
  id: string
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
  createdByName?: string
  createdAt?: string
  items: LessonPlanItem[]
}

export default function TeacherLessonPlanPage() {
  const router = useRouter()
  const { user, classrooms, loading: userLoading } = useCurrentUser()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [lessonPlanDates, setLessonPlanDates] = useState<string[]>([])
  const [dayOffDates, setDayOffDates] = useState<string[]>([])

  // Fetch lesson plan dates and day-off dates for calendar indicators
  useEffect(() => {
    fetchLessonPlanDates()
    fetchDayOffDates()
  }, [])

  // Fetch lesson plan when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchLessonPlan(selectedDate)
    } else {
      setLessonPlan(null)
    }
  }, [selectedDate])

  const fetchLessonPlanDates = async () => {
    try {
      const response = await fetch("/api/lesson-plans?pageSize=1000")
      if (response.ok) {
        const data = await response.json()
        const dates = data.data.map((lp: LessonPlan) => lp.date)
        setLessonPlanDates(dates)
      }
    } catch (error) {
      console.error("Error fetching lesson plan dates:", error)
    }
  }

  const fetchLessonPlan = async (date: Date) => {
    setLoading(true)
    try {
      const dateString = format(date, "yyyy-MM-dd")
      const response = await fetch(`/api/lesson-plans?date=${dateString}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setLessonPlan(data.data[0])
        } else {
          setLessonPlan(null)
        }
      }
    } catch (error) {
      console.error("Error fetching lesson plan:", error)
      setLessonPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchDayOffDates = async () => {
    try {
      // TODO: Replace with actual API call to fetch day-off dates from Agenda entity
      // const response = await fetch("/api/agendas?type=day-off&pageSize=1000")
      // if (response.ok) {
      //   const data = await response.json()
      //   const dates = data.data.map((agenda: any) => agenda.date)
      //   setDayOffDates(dates)
      // }
      
      // For now, set empty array. Will be implemented with Agenda entity
      setDayOffDates([])
    } catch (error) {
      console.error("Error fetching day-off dates:", error)
    }
  }

  const handleCreateClick = () => {
    const dateParam = selectedDate ? `?date=${format(selectedDate, "yyyy-MM-dd")}` : ""
    router.push(`/teacher/lesson-plan/new${dateParam}`)
  }

  const handleDelete = (id: string) => {
    setLessonPlan(null)
    fetchLessonPlanDates() // Refresh calendar
  }

  // Show loading state
  if (userLoading) {
    return (
      <>
        <PageHeader
          title="Rencana Pembelajaran"
          description="Kelola rencana pembelajaran untuk rombongan belajar"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
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
          title="Rencana Pembelajaran"
          description="Kelola rencana pembelajaran untuk rombongan belajar"
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
          ]}
        />
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <IconNoteOff className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
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
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Rencana Pembelajaran"
        description="Kelola rencana pembelajaran untuk rombongan belajar"
        breadcrumbs={[
          { label: "Beranda", href: "/teacher", icon: IconHome },
          { label: "Rencana Pembelajaran", href: "/teacher/lesson-plan", icon: IconChalkboardTeacher },
        ]}
      />
      <div id="container" className="grid gap-3 lg:grid-cols-3 overflow-x-hidden">
        <div className="lg:col-span-1 min-w-0">
          <LessonPlanCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            lessonPlanDates={lessonPlanDates}
            dayOffDates={dayOffDates}
          />
        </div>
        <div className="lg:col-span-2 min-w-0">
          <DetailLessonPlan
            selectedDate={selectedDate}
            lessonPlan={lessonPlan}
            loading={loading}
            onDelete={handleDelete}
            onCreateClick={handleCreateClick}
          />
        </div>
      </div>
    </>
  )
}