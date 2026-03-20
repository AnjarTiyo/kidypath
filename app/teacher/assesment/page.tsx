"use client"

import { useState, useEffect } from "react"
import { IconUser, IconChalkboard, IconFileText, IconHome, IconChecklist, IconPlus } from "@tabler/icons-react"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CompactDateNavigation, LessonPlanCompactCard } from "@/components/assessment"
import { PageHeader } from "@/components/layout/page-header"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface LessonPlanData {
  id: string
  classroomId: string
  topic: string
  subtopic?: string | null
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

interface AttendanceData {
  classroomId: string
  checkIn: {
    total: number
    present: number
    sick: number
    permission: number
  }
  checkOut: {
    total: number
    present: number
    sick: number
    permission: number
  }
}

interface AssessmentData {
  classroomId: string
  completedCount: number
  totalStudents: number
  progressPercentage: number
}

interface AttendanceRecord {
  type: "check_in" | "check_out"
  status: "present" | "sick" | "permission" | string
}

export default function StudentAssessmentPage() {
  const { user, classrooms, loading } = useCurrentUser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [lessonPlans, setLessonPlans] = useState<LessonPlanData[]>([])
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceData>>(new Map())
  const [assessmentData, setAssessmentData] = useState<Map<string, AssessmentData>>(new Map())
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const router = useRouter()

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

  // Fetch attendance data for each classroom
  useEffect(() => {
    if (loading || classrooms.length === 0) {
      return
    }

    const abortController = new AbortController()

    const fetchAttendanceData = async () => {
      setLoadingAttendance(true)
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const attendanceMap = new Map<string, AttendanceData>()

        console.log("🔍 Fetching attendance for date:", dateStr)
        console.log("🔍 Classrooms:", classrooms)

        // Fetch attendance for each classroom
        await Promise.all(
          classrooms.map(async (classroom) => {
            try {
              console.log(`📊 Fetching attendance for classroom: ${classroom.id} (${classroom.name})`)
              
              const response = await fetch(
                `/api/attendances?classroomId=${classroom.id}&date=${dateStr}`,
                { signal: abortController.signal }
              )

              if (response.ok) {
                const data: { data?: AttendanceRecord[] } = await response.json()
                const records = data.data || []

                console.log(`✅ Attendance records for ${classroom.name}:`, records.length, "records")
                console.log(`   Raw data:`, records)

                // Separate check-in and check-out
                const checkInRecords = records.filter((record) => record.type === 'check_in')
                const checkOutRecords = records.filter((record) => record.type === 'check_out')

                console.log(`   Check-in: ${checkInRecords.length}, Check-out: ${checkOutRecords.length}`)

                attendanceMap.set(classroom.id, {
                  classroomId: classroom.id,
                  checkIn: {
                    total: checkInRecords.length,
                    present: checkInRecords.filter((record) => record.status === 'present').length,
                    sick: checkInRecords.filter((record) => record.status === 'sick').length,
                    permission: checkInRecords.filter((record) => record.status === 'permission').length,
                  },
                  checkOut: {
                    total: checkOutRecords.length,
                    present: checkOutRecords.filter((record) => record.status === 'present').length,
                    sick: checkOutRecords.filter((record) => record.status === 'sick').length,
                    permission: checkOutRecords.filter((record) => record.status === 'permission').length,
                  },
                })
              } else {
                console.error(`❌ Failed to fetch attendance for ${classroom.name}, status:`, response.status)
              }
            } catch (error) {
              if (error instanceof Error && error.name !== 'AbortError') {
                console.error(`Error fetching attendance for classroom ${classroom.id}:`, error)
              }
            }
          })
        )

        console.log("📈 Final attendance map:", attendanceMap)
        setAttendanceData(attendanceMap)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error fetching attendance data:", error)
        }
      } finally {
        setLoadingAttendance(false)
      }
    }

    fetchAttendanceData()

    return () => {
      abortController.abort()
    }
  }, [selectedDate, classrooms, loading])

  // Fetch assessment data for each classroom
  useEffect(() => {
    if (loading || classrooms.length === 0) {
      return
    }

    const abortController = new AbortController()

    const fetchAssessmentData = async () => {
      setLoadingAssessments(true)
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const assessmentMap = new Map<string, AssessmentData>()

        // Fetch assessments and students for each classroom
        await Promise.all(
          classrooms.map(async (classroom) => {
            try {
              // Fetch students to get total count
              const studentsResponse = await fetch(
                `/api/students?classroom=${classroom.id}&pageSize=1000`,
                { signal: abortController.signal }
              )

              // Fetch assessments for this classroom and date
              const assessmentsResponse = await fetch(
                `/api/assessments?classroomId=${classroom.id}&date=${dateStr}`,
                { signal: abortController.signal }
              )

              if (studentsResponse.ok && assessmentsResponse.ok) {
                const studentsData = await studentsResponse.json()
                const assessmentsData = await assessmentsResponse.json()

                const totalStudents = studentsData.total || studentsData.data?.length || 0
                const completedCount = assessmentsData.total || assessmentsData.data?.length || 0
                const progressPercentage = totalStudents > 0 
                  ? Math.round((completedCount / totalStudents) * 100) 
                  : 0

                assessmentMap.set(classroom.id, {
                  classroomId: classroom.id,
                  completedCount,
                  totalStudents,
                  progressPercentage,
                })
              }
            } catch (error) {
              if (error instanceof Error && error.name !== 'AbortError') {
                console.error(`Error fetching assessment data for classroom ${classroom.id}:`, error)
              }
            }
          })
        )

        setAssessmentData(assessmentMap)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error fetching assessment data:", error)
        }
      } finally {
        setLoadingAssessments(false)
      }
    }

    fetchAssessmentData()

    return () => {
      abortController.abort()
    }
  }, [selectedDate, classrooms, loading])

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

  const handleAssessLessonPlan = (classroomId: string) => {
    router.push(`/teacher/assesment/${classroomId}/new?date=${format(selectedDate, "yyyy-MM-dd")}`)
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
          <span className="font-semibold text-sm">Teacher {user?.name || "-"}</span>
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
            {lessonPlans.map((plan) => {
              const attendance = attendanceData.get(plan.classroomId)
              const assessment = assessmentData.get(plan.classroomId)
              const checkInConducted = (attendance?.checkIn.total || 0) > 0
              const checkOutConducted = (attendance?.checkOut.total || 0) > 0

              console.log(`🎯 Rendering card for classroom ${plan.classroomId}`)
              console.log(`   Attendance data:`, attendance)
              console.log(`   Assessment data:`, assessment)
              console.log(`   checkInConducted:`, checkInConducted)
              console.log(`   checkOutConducted:`, checkOutConducted)

              return (
                <LessonPlanCompactCard
                  key={plan.id}
                  lessonPlanStatus={{
                    isCreated: true,
                    topic: plan.topic,
                    subtopic: plan.subtopic ?? undefined,
                  }}
                  checkInStatus={{
                    isConducted: checkInConducted,
                    completedCount: attendance?.checkIn.total || 0,
                    totalStudents: assessment?.totalStudents || 0,
                  }}
                  assessmentStatus={{
                    completedCount: assessment?.completedCount || 0,
                    totalStudents: assessment?.totalStudents || 0,
                    progressPercentage: assessment?.progressPercentage || 0,
                  }}
                  checkOutStatus={{
                    isConducted: checkOutConducted,
                    completedCount: attendance?.checkOut.total || 0,
                    totalStudents: assessment?.totalStudents || 0,
                  }}
                  onEditLessonPlan={() => console.log("Edit lesson plan", plan.id)}
                  onCheckIn={() => window.location.href = `/teacher/class/${plan.classroomId}/check-in`}
                  onAssess={() => handleAssessLessonPlan(plan.classroomId)}
                  onCheckOut={() => window.location.href = `/teacher/class/${plan.classroomId}/check-out`}
                />
              )
            })}

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
            <CardContent className="py-8">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Belum ada rencana pembelajaran untuk tanggal ini
                </p>
                <Link href={`/teacher/lesson-plan/new?date=${format(selectedDate, "yyyy-MM-dd")}`}>
                  <Button
                    variant="default"
                    className="h-7"
                    size="sm"
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Buat Rencana Pembelajaran
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}