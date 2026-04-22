"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconLoader2, IconDeviceFloppy, IconCheck, IconAlertCircle, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { StudentSelector, Student } from "./student-selector"
import { MoodSelector, MoodType } from "./mood-selector"
import { AttendanceStatusSelector, AttendanceStatus } from "./attendance-status-selector"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface AttendanceFormProps {
  classroomId: string
  classroomName: string
  date: Date
  type: "check_in" | "check_out"
  editStudentId?: string // Optional: student to jump to for editing
  onSuccess?: () => void
  onComplete?: () => void
  onProgressClick?: () => void // New: callback when progress badge is clicked
}

interface ExistingAttendance {
  id: string
  studentId: string
  status: AttendanceStatus
  mood: MoodType | null
  note: string | null
}

interface AttendancesResponse {
  data?: ExistingAttendance[]
}

export function AttendanceForm({
  classroomId,
  classroomName,
  date,
  type,
  editStudentId,
  onSuccess,
  onComplete,
  onProgressClick,
}: AttendanceFormProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [mood, setMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [existingAttendances, setExistingAttendances] = useState<Map<string, ExistingAttendance>>(new Map())

  const typeLabel = type === "check_in" ? "Check-In" : "Check-Out"
  const formattedDate = format(date, "EEEE, dd MMM yyyy", { locale: localeId })
  const selectedStudent = students[currentStudentIndex] || null
  const totalStudents = students.length
  const isLastStudent = currentStudentIndex === totalStudents - 1

  // Fetch students and existing attendances
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStudents(true)
        
        // Fetch students
        const studentsResponse = await fetch(
          `/api/students?classroom=${classroomId}&pageSize=100`
        )
        
        // Fetch existing attendances for this date and type
        const formattedDate = format(date, "yyyy-MM-dd")
        const attendancesResponse = await fetch(
          `/api/attendances?classroomId=${classroomId}&date=${formattedDate}&type=${type}`
        )
        
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          const studentsList = studentsData.data || []
          setStudents(studentsList)
          
          // Load existing attendances
          if (attendancesResponse.ok) {
            const attendancesData: AttendancesResponse = await attendancesResponse.json()
            const attendancesList = attendancesData.data || []
            
            // Map attendances by studentId
            const attendancesMap = new Map<string, ExistingAttendance>()
            attendancesList.forEach((att) => {
              attendancesMap.set(att.studentId, {
                id: att.id,
                studentId: att.studentId,
                status: att.status,
                mood: att.mood,
                note: att.note,
              })
            })
            setExistingAttendances(attendancesMap)
            setSavedCount(attendancesList.length)
            
            // If editing specific student, jump to that student
            if (editStudentId) {
              const index = studentsList.findIndex((s: Student) => s.id === editStudentId)
              if (index !== -1) {
                setCurrentStudentIndex(index)
              }
            } else {
              // Auto-select first student without attendance
              const firstUnsavedIndex = studentsList.findIndex(
                (s: Student) => !attendancesMap.has(s.id)
              )
              setCurrentStudentIndex(firstUnsavedIndex !== -1 ? firstUnsavedIndex : 0)
            }
          } else {
            setCurrentStudentIndex(0)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchData()
  }, [classroomId, date, type, editStudentId])

  // Load existing attendance data when student changes
  useEffect(() => {
    if (selectedStudent && existingAttendances.has(selectedStudent.id)) {
      const existing = existingAttendances.get(selectedStudent.id)!
      setAttendanceStatus(existing.status)
      setMood(existing.mood)
      setNote(existing.note || "")
    } else {
      // Reset form for new student
      setAttendanceStatus(null)
      setMood(null)
      setNote("")
    }
    setError(null)
  }, [currentStudentIndex, selectedStudent, existingAttendances])

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
    }
  }

  const handleNextStudent = () => {
    if (currentStudentIndex < totalStudents - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStudent) {
      setError("Pilih siswa terlebih dahulu")
      return
    }

    // Determine final status
    let finalStatus: AttendanceStatus
    let finalMood: MoodType | null = null

    if (attendanceStatus === "sick" || attendanceStatus === "permission") {
      finalStatus = attendanceStatus
    } else {
      if (!mood) {
        setError("Pilih mood siswa")
        return
      }
      finalStatus = "present"
      finalMood = mood
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          classroomId,
          date: format(date, "yyyy-MM-dd"),
          type,
          status: finalStatus,
          mood: finalMood,
          note: note.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan")
        return
      }

      // Update existing attendances map
      const updatedMap = new Map(existingAttendances)
      updatedMap.set(selectedStudent.id, {
        id: data.id,
        studentId: selectedStudent.id,
        status: finalStatus,
        mood: finalMood,
        note: note.trim() || null,
      })
      setExistingAttendances(updatedMap)
      setSavedCount(updatedMap.size)
      
      onSuccess?.()

      // Move to next student or complete
      if (isLastStudent) {
        onComplete?.()
      } else {
        // Jump to next unsaved student if exists
        const nextUnsavedIndex = students.findIndex(
          (s, idx) => idx > currentStudentIndex && !updatedMap.has(s.id)
        )
        if (nextUnsavedIndex !== -1) {
          setCurrentStudentIndex(nextUnsavedIndex)
        } else {
          setCurrentStudentIndex(currentStudentIndex + 1)
        }
      }
    } catch (error) {
      console.error("Error saving attendance:", error)
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const showMoodSelector = attendanceStatus !== "sick" && attendanceStatus !== "permission"
  const canSubmit = selectedStudent && (mood || attendanceStatus === "sick" || attendanceStatus === "permission")

  if (loadingStudents) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat data siswa...</p>
        </CardContent>
      </Card>
    )
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada siswa di kelas ini
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="p-4">
          {/* Compact header with info and progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-medium">{classroomName}</div>
                <div className="text-xs text-muted-foreground">{formattedDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  onProgressClick && savedCount > 0 && "cursor-pointer hover:bg-accent"
                )}
                onClick={() => {
                  if (onProgressClick && savedCount > 0) {
                    onProgressClick()
                  }
                }}
              >
                {savedCount}/{totalStudents}
              </Badge>
              <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            </div>
          </div>

          {/* Student Navigation */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Siswa</Label>
              <span className="text-xs text-muted-foreground">
                {currentStudentIndex + 1} dari {totalStudents}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePreviousStudent}
                disabled={currentStudentIndex === 0}
                className="h-9 w-9 shrink-0"
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <StudentSelector
                  students={students}
                  selectedStudent={selectedStudent}
                  onStudentSelect={(student) => {
                    const index = students.findIndex(s => s.id === student.id)
                    if (index !== -1) setCurrentStudentIndex(index)
                  }}
                  disabled={loading}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleNextStudent}
                disabled={currentStudentIndex === totalStudents - 1}
                className="h-9 w-9 shrink-0"
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedStudent && (
            <>
              {/* Absence Options - Compact */}
              <div className="mb-4">
                <Label className="text-xs mb-2 block">Tidak Hadir?</Label>
                <AttendanceStatusSelector
                  selectedStatus={attendanceStatus}
                  onStatusSelect={setAttendanceStatus}
                  disabled={loading}
                />
              </div>

              {/* Mood Selector - Compact */}
              {showMoodSelector && (
                <div className="mb-4">
                  <Label className="text-xs mb-2 block">
                    Bagaimana perasaan {selectedStudent.fullName}?
                  </Label>
                  <MoodSelector
                    selectedMood={mood}
                    onMoodSelect={setMood}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Compact Note */}
              <div className="mb-4">
                <Label htmlFor="note" className="text-xs mb-2 block">Catatan (opsional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tulis catatan..."
                  rows={2}
                  disabled={loading}
                  className="text-sm"
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="flex items-center gap-2 rounded-sm bg-destructive/10 p-2 text-xs text-destructive mb-3">
                  <IconAlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit Button - Compact */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !canSubmit}
                size="sm"
              >
                {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <IconDeviceFloppy className="mr-2 h-4 w-4" />}
                {isLastStudent ? `Simpan & Selesai` : `Simpan & Lanjut`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
