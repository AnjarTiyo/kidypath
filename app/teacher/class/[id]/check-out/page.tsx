"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AttendanceForm, AttendanceSummary } from "@/components/attendance"
import type { MoodType } from "@/components/attendance"
import { Button } from "@/components/ui/button"
import { IconLoader2, IconChevronLeft, IconChevronRight, IconRefresh } from "@tabler/icons-react"
import { format, addDays, subDays } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface Classroom {
  id: string
  name: string
  academicYear: string | null
}

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string | null
  status: "present" | "sick" | "permission"
  mood: MoodType | null
  note: string | null
}

export default function ClassCheckoutPage() {
  const params = useParams()
  const classroomId = params.id as string
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/classrooms/${classroomId}`)
        if (response.ok) {
          const data = await response.json()
          setClassroom(data)
        } else {
          setError("Kelas tidak ditemukan")
        }
      } catch (error) {
        console.error("Error fetching classroom:", error)
        setError("Terjadi kesalahan saat memuat data kelas")
      } finally {
        setLoading(false)
      }
    }

    if (classroomId) {
      fetchClassroom()
    }
  }, [classroomId])

  const fetchAttendances = async () => {
    try {
      setLoadingSummary(true)
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch(
        `/api/attendances?classroomId=${classroomId}&date=${formattedDate}&type=check_out`
      )
      if (response.ok) {
        const data = await response.json()
        setAttendances(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching attendances:", error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleComplete = async () => {
    setIsCompleted(true)
    await fetchAttendances()
  }

  const handleReset = () => {
    setIsCompleted(false)
    setAttendances([])
  }

  const handleEdit = (studentId: string) => {
    // Reset to form mode and navigate to that student
    setIsCompleted(false)
  }

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1))
    setIsCompleted(false)
  }

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1))
    setIsCompleted(false)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
    setIsCompleted(false)
  }

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !classroom) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            {error || "Kelas tidak ditemukan"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      {/* Compact Header with Date Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Check-Out Siswa</h1>
          <p className="text-sm text-muted-foreground">{classroom.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
            className="h-8 w-8"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center min-w-[140px]">
            <div className="text-sm font-medium">
              {format(selectedDate, "dd MMM yyyy", { locale: localeId })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(selectedDate, "EEEE", { locale: localeId })}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-8 w-8"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              Hari Ini
            </Button>
          )}
        </div>
      </div>

      {isCompleted ? (
        <div className="space-y-4">
          <AttendanceSummary
            classroomName={classroom.name}
            date={format(selectedDate, "yyyy-MM-dd")}
            type="check_out"
            attendances={attendances}
            onEdit={handleEdit}
            loading={loadingSummary}
          />
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
            size="sm"
          >
            <IconRefresh className="mr-2 h-4 w-4" />
            Input Ulang
          </Button>
        </div>
      ) : (
        <AttendanceForm
          classroomId={classroomId}
          classroomName={classroom.name}
          date={selectedDate}
          type="check_out"
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
