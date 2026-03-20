"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AssessmentSummary } from "@/components/assessment/assessment-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconLoader2, IconChevronLeft, IconChevronRight, IconChalkboardTeacher, IconHome } from "@tabler/icons-react"
import { format, addDays, subDays, parseISO } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { PageHeader } from "@/components/layout/page-header"

interface Classroom {
  id: string
  name: string
  academicYear: string | null
}

interface Student {
  id: string
  fullName: string
  name?: string
}

interface LessonPlan {
  id: string
  classroomId: string
  date: string
  topic: string
  subtopic: string | null
}

interface AssessmentRecord {
  id: string
  studentId: string
  studentName: string | null
  scopeId: string
  scopeName: string | null
  objectiveId: string
  activityContext: string
  score: string | null
  note: string | null
}

export default function AssessmentPageClient() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const classroomId = params.id as string

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get("date")
    if (dateParam) {
      try {
        return parseISO(dateParam)
      } catch (error) {
        console.error("Invalid date parameter:", dateParam)
        return new Date()
      }
    }
    return new Date()
  })

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [totalStudents, setTotalStudents] = useState(0)
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const classroomResponse = await fetch(`/api/classrooms/${classroomId}`)
        if (!classroomResponse.ok) {
          setError("Kelas tidak ditemukan")
          return
        }
        const classroomData = await classroomResponse.json()
        setClassroom(classroomData)

        const studentsResponse = await fetch(`/api/students?classroom=${classroomId}&pageSize=100`)
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setTotalStudents(studentsData.total || 0)
          setStudents(studentsData.data || [])
        }

        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const lessonPlanResponse = await fetch(`/api/lesson-plans?date=${dateStr}&classroomId=${classroomId}`)

        if (lessonPlanResponse.ok) {
          const lessonPlanData = await lessonPlanResponse.json()
          const plans = lessonPlanData.data || []

          if (plans.length > 0) {
            setLessonPlan(plans[0])
          } else {
            setLessonPlan(null)
            setError("Belum ada rencana pembelajaran untuk tanggal ini")
          }
        } else {
          setLessonPlan(null)
          setError("Belum ada rencana pembelajaran untuk tanggal ini")
        }

        const assessmentsResponse = await fetch(
          `/api/assessments?classroomId=${classroomId}&date=${dateStr}`
        )
        if (assessmentsResponse.ok) {
          const assessmentsData = await assessmentsResponse.json()
          setAssessments(assessmentsData.data || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Terjadi kesalahan saat memuat data")
      } finally {
        setLoading(false)
      }
    }

    if (classroomId) {
      fetchData()
    }
  }, [classroomId, selectedDate])

  const handleEdit = (studentId: string) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    router.push(`/teacher/assesment/${classroomId}/${studentId}?date=${dateStr}`)
  }

  const handleContinue = () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    router.push(`/teacher/assesment/${classroomId}/new?date=${dateStr}`)
  }

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1)
    setSelectedDate(newDate)
    const dateStr = format(newDate, "yyyy-MM-dd")
    router.push(`/teacher/assesment/${classroomId}?date=${dateStr}`, { scroll: false })
  }

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    setSelectedDate(newDate)
    const dateStr = format(newDate, "yyyy-MM-dd")
    router.push(`/teacher/assesment/${classroomId}?date=${dateStr}`, { scroll: false })
  }

  const handleToday = () => {
    const newDate = new Date()
    setSelectedDate(newDate)
    const dateStr = format(newDate, "yyyy-MM-dd")
    router.push(`/teacher/assesment/${classroomId}?date=${dateStr}`, { scroll: false })
  }

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Kelas tidak ditemukan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="border-b bg-background px-2 sm:px-4 py-2 shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <PageHeader
              title="Jurnal Penilaian Harian"
              description="Jurnal penilaian harian untuk rombongan belajar"
              breadcrumbs={[
                { label: "Beranda", href: "/teacher", icon: IconHome },
                { label: "Rencana Pembelajaran", href: "/teacher/assesment", icon: IconChalkboardTeacher },
              ]}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Rombel: {classroom.name}</div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
              className="h-6 w-6 sm:h-7 sm:w-7"
            >
              <IconChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>

            <div className="text-center min-w-[100px] sm:min-w-[120px]">
              <div className="text-[10px] sm:text-xs font-medium">
                {format(selectedDate, "dd MMM yyyy", { locale: localeId })}
              </div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground">
                {format(selectedDate, "EEEE", { locale: localeId })}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              className="h-6 w-6 sm:h-7 sm:w-7"
            >
              <IconChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>

            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToday}
                className="text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2"
              >
                Hari Ini
              </Button>
            )}
          </div>
          </div>
        </div>

        {lessonPlan && (
          <div className="mt-2 bg-muted/50 rounded px-2 py-1.5">
            <div className="text-[10px] sm:text-[11px] flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="font-medium">Tema:</span>
              <span className="truncate">{lessonPlan.topic}</span>
              <>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">Sub:</span>
                  <span className="truncate">{lessonPlan.subtopic || "-"}</span>
                </>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2 sm:p-4 max-w-full">
          {error && !lessonPlan && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5"
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-yellow-900 text-xs">{error}</h3>
                    <p className="text-[11px] text-yellow-800 mt-0.5">
                      Silakan buat rencana pembelajaran terlebih dahulu untuk dapat melakukan penilaian.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonPlan ? (
            <AssessmentSummary
              classroomName={classroom.name}
              date={format(selectedDate, "dd MMM yyyy", { locale: localeId })}
              assessments={assessments}
              totalStudents={totalStudents}
              students={students}
              onEdit={handleEdit}
              onContinue={handleContinue}
              loading={loadingAssessments}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}