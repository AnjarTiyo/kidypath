"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AssessmentForm, LessonPlanItem } from "@/components/assessment/assessment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconLoader2, IconArrowLeft, IconTriangle, IconBuilding } from "@tabler/icons-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface Classroom {
  id: string
  name: string
  academicYear: string | null
}

interface LessonPlan {
  id: string
  classroomId: string
  date: string
  topic: string
  subtopic: string | null
  items: LessonPlanItem[]
}

export default function AssessmentFormPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const classroomId = params.id as string
  const studentId = params.studentId as string
  const dateParam = searchParams.get("date")
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    dateParam ? new Date(dateParam) : new Date()
  )
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch classroom
        const classroomResponse = await fetch(`/api/classrooms/${classroomId}`)
        if (!classroomResponse.ok) {
          setError("Kelas tidak ditemukan")
          return
        }
        const classroomData = await classroomResponse.json()
        setClassroom(classroomData)

        // Fetch lesson plan for the selected date
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

  const handleComplete = () => {
    // Navigate back to assessment summary
    router.push(`/teacher/assesment/${classroomId}?date=${format(selectedDate, "yyyy-MM-dd")}`)
  }

  const handleBack = () => {
    router.back()
  }

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
      {/* Compact Fixed Header */}
      <div className="border-b bg-background px-2 sm:px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">Penilaian Harian</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center truncate">
              <IconBuilding className="inline h-3 w-3 mr-1" />
              {classroom.name}</p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] sm:text-xs font-medium">
              {format(selectedDate, "dd MMM yyyy", { locale: localeId })}
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground">
              {format(selectedDate, "EEEE", { locale: localeId })}
            </div>
          </div>
        </div>

        {/* Compact Lesson Plan Info */}
        {lessonPlan && (
          <div className="mt-2 bg-muted/50 rounded px-2 py-1.5">
            <div className="text-[10px] sm:text-[11px] flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="font-medium">Tema:</span>
              <span className="truncate">{lessonPlan.topic}</span>
              {lessonPlan.subtopic && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">Sub:</span>
                  <span className="truncate">{lessonPlan.subtopic}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2 sm:p-4 max-w-full">
          {/* Error State */}
          {error && !lessonPlan && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <IconTriangle className="h-5 w-5 text-yellow-900 mt-0.5 flex-shrink-0" />
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

          {/* Assessment Form */}
          {lessonPlan && (
            <AssessmentForm
              classroomId={classroomId}
              classroomName={classroom.name}
              date={selectedDate}
              lessonPlanItems={lessonPlan.items}
              editStudentId={studentId === "new" ? undefined : studentId}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  )
}
