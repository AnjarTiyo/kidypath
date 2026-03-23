"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  IconLoader2,
  IconDeviceFloppy,
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { StudentSelector, Student } from "@/components/attendance/student-selector"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Separator } from "../ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AssessmentScoreTable } from "./assessment-score-table"
import { AssessmentSummarySection } from "./assessment-summary-section"
import { AssessmentPhotoCapture } from "./assessment-photo-capture"
import {
  type LessonPlanItem,
  type AssessmentRow,
  type ExistingAssessment,
  getScopeLabel,
} from "./assessment-types"

// Re-export for consumers that import LessonPlanItem from this file
export type { LessonPlanItem } from "./assessment-types"

interface AssessmentFormProps {
  classroomId: string
  classroomName: string
  date: Date
  lessonPlanItems: LessonPlanItem[]
  editStudentId?: string
  onSuccess?: () => void
  onComplete?: () => void
  onProgressClick?: () => void
}

interface DevelopmentScope {
  id: string
  name: string
}

interface LearningObjective {
  id: string
  scopeId: string
  description: string
}

interface AssessmentsResponse {
  data?: ExistingAssessment[]
}

export function AssessmentForm({
  classroomId,
  classroomName,
  date,
  lessonPlanItems,
  editStudentId,
  onSuccess,
  onComplete,
  onProgressClick,
}: AssessmentFormProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingObjectives, setLoadingObjectives] = useState(true)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [existingAssessments, setExistingAssessments] = useState<Map<string, ExistingAssessment>>(new Map())
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([])
  const [developmentScopes, setDevelopmentScopes] = useState<DevelopmentScope[]>([])
  const [assessmentRows, setAssessmentRows] = useState<AssessmentRow[]>([])
  const [summary, setSummary] = useState("")
  const [generateSummaryChecked, setGenerateSummaryChecked] = useState(false)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showNoPhotoDialog, setShowNoPhotoDialog] = useState(false)

  const selectedStudent = students[currentStudentIndex] || null
  const totalStudents = students.length
  const isLastStudent = currentStudentIndex === totalStudents - 1
  const progressPercentage = totalStudents > 0 ? Math.round((savedCount / totalStudents) * 100) : 0

  // Fetch learning objectives and development scopes
  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        setLoadingObjectives(true)
        const [objRes, scopeRes] = await Promise.all([
          fetch("/api/learning-objectives"),
          fetch("/api/development-scopes"),
        ])
        if (objRes.ok) setLearningObjectives((await objRes.json()).data || [])
        if (scopeRes.ok) setDevelopmentScopes((await scopeRes.json()).data || [])
      } catch (err) {
        console.error("Error fetching objectives:", err)
      } finally {
        setLoadingObjectives(false)
      }
    }
    fetchObjectives()
  }, [])

  // Build assessment rows whenever lesson plan or scope data changes
  useEffect(() => {
    if (lessonPlanItems.length > 0 && learningObjectives.length > 0 && developmentScopes.length > 0) {
      const rows: AssessmentRow[] = lessonPlanItems.map((item) => {
        const scope = developmentScopes.find((s) => s.name === item.developmentScope)
        const defaultObjective = learningObjectives.find((obj) => obj.scopeId === scope?.id)
        return {
          scopeId: scope?.id || "",
          scopeName: getScopeLabel(item.developmentScope),
          objectiveId: defaultObjective?.id || "",
          objectiveDescription: item.learningGoal,
          activityContext: item.activityContext,
          score: "BSH",
          note: "",
        }
      })
      setAssessmentRows(rows)
    }
  }, [lessonPlanItems, learningObjectives, developmentScopes])

  // Fetch students and existing assessments for the date
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStudents(true)
        const dateStr = format(date, "yyyy-MM-dd")
        const [studentsRes, assessmentsRes] = await Promise.all([
          fetch(`/api/students?classroom=${classroomId}&pageSize=100`),
          fetch(`/api/assessments?classroomId=${classroomId}&date=${dateStr}`),
        ])

        if (!studentsRes.ok) return
        const studentsList: Student[] = (await studentsRes.json()).data || []
        setStudents(studentsList)

        if (assessmentsRes.ok) {
          const assessmentsData: AssessmentsResponse = await assessmentsRes.json()
          const map = new Map<string, ExistingAssessment>()
          for (const a of assessmentsData.data || []) {
            map.set(a.studentId, {
              id: a.id,
              studentId: a.studentId,
              summary: a.summary,
              imageUrl: a.imageUrl || null,
              items: a.items || [],
            })
          }
          setExistingAssessments(map)
          setSavedCount(map.size)

          if (editStudentId) {
            const idx = studentsList.findIndex((s) => s.id === editStudentId)
            if (idx !== -1) setCurrentStudentIndex(idx)
          } else {
            const firstUnsaved = studentsList.findIndex((s) => !map.has(s.id))
            setCurrentStudentIndex(firstUnsaved !== -1 ? firstUnsaved : 0)
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoadingStudents(false)
      }
    }
    if (lessonPlanItems.length > 0) fetchData()
  }, [classroomId, date, editStudentId, lessonPlanItems.length])

  // Sync form state when selected student changes
  useEffect(() => {
    // Reset image state — AssessmentPhotoCapture remounts via key={selectedStudent?.id}
    setPendingImageFile(null)

    if (selectedStudent && existingAssessments.has(selectedStudent.id)) {
      const existing = existingAssessments.get(selectedStudent.id)!
      setSummary(existing.summary || "")
      setExistingImageUrl(existing.imageUrl || null)
      setAssessmentRows((prev) =>
        prev.map((row) => {
          const item = existing.items.find((i) => i.scopeId === row.scopeId)
          return item
            ? { ...row, objectiveId: item.objectiveId, activityContext: item.activityContext, score: item.score, note: item.note || "" }
            : row
        })
      )
    } else if (lessonPlanItems.length > 0) {
      setSummary("")
      setExistingImageUrl(null)
      setAssessmentRows((prev) =>
        lessonPlanItems.map((item, idx) => ({
          ...(prev[idx] ?? {}),
          activityContext: item.activityContext,
          score: "BSH" as const,
          note: "",
        })) as AssessmentRow[]
      )
    }
    setError(null)
  }, [currentStudentIndex, selectedStudent, existingAssessments])

  const updateAssessmentRow = (index: number, field: keyof AssessmentRow, value: string) => {
    setAssessmentRows((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleGenerateSummary = async () => {
    if (!selectedStudent) return
    setGeneratingSummary(true)
    setError(null)
    try {
      const res = await fetch("/api/assessments/summary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: selectedStudent.fullName,
          date: format(date, "EEEE, dd MMMM yyyy", { locale: localeId }),
          assessmentItems: assessmentRows.map((row) => ({
            scopeName: row.scopeName,
            objectiveDescription: row.objectiveDescription,
            activityContext: row.activityContext,
            score: row.score,
            note: row.note || null,
          })),
        }),
      })
      if (!res.ok) throw new Error("Failed")
      setSummary((await res.json()).summary)
    } catch {
      setError("Gagal membuat ringkasan otomatis. Silakan tulis manual.")
    } finally {
      setGeneratingSummary(false)
    }
  }

  const doSave = async () => {
    if (!selectedStudent) return
    setLoading(true)
    setError(null)
    try {
      // Upload image if there is a new one
      let finalImageUrl: string | null = existingImageUrl
      if (pendingImageFile) {
        setUploadingImage(true)
        try {
          const form = new FormData()
          form.append("file", pendingImageFile)
          const uploadRes = await fetch("/api/upload", { method: "POST", body: form })
          if (!uploadRes.ok) throw new Error("Upload failed")
          finalImageUrl = (await uploadRes.json()).url
        } finally {
          setUploadingImage(false)
        }
      }

      // Auto-generate summary if opted in
      let finalSummary = summary
      if (generateSummaryChecked && !summary.trim()) {
        try {
          const summaryRes = await fetch("/api/assessments/summary/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentName: selectedStudent.fullName,
              date: format(date, "EEEE, dd MMMM yyyy", { locale: localeId }),
              assessmentItems: assessmentRows.map((row) => ({
                scopeName: row.scopeName,
                objectiveDescription: row.objectiveDescription,
                activityContext: row.activityContext,
                score: row.score,
                note: row.note || null,
              })),
            }),
          })
          if (summaryRes.ok) {
            finalSummary = (await summaryRes.json()).summary
            setSummary(finalSummary)
          }
        } catch {
          // Non-fatal — continue without summary
        }
      }

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          classroomId,
          date: format(date, "yyyy-MM-dd"),
          summary: finalSummary.trim() || null,
          imageUrl: finalImageUrl,
          items: assessmentRows.map((row) => ({
            scopeId: row.scopeId,
            objectiveId: row.objectiveId,
            activityContext: row.activityContext,
            score: row.score,
            note: row.note.trim() || null,
          })),
        }),
      })
      if (!res.ok) { setError("Terjadi kesalahan saat menyimpan penilaian"); return }

      const saved = await res.json()
      const updatedMap = new Map(existingAssessments)
      updatedMap.set(selectedStudent.id, {
        id: saved.id,
        studentId: selectedStudent.id,
        summary: finalSummary || null,
        imageUrl: finalImageUrl,
        items: assessmentRows.map((row) => ({
          scopeId: row.scopeId,
          objectiveId: row.objectiveId,
          activityContext: row.activityContext,
          score: row.score,
          note: row.note.trim() || null,
        })),
      })
      setExistingAssessments(updatedMap)
      setSavedCount(updatedMap.size)
      setPendingImageFile(null)
      setExistingImageUrl(finalImageUrl)

      onSuccess?.()

      if (isLastStudent) {
        onComplete?.()
      } else {
        const nextUnsaved = students.findIndex((s, idx) => idx > currentStudentIndex && !updatedMap.has(s.id))
        setCurrentStudentIndex(nextUnsaved !== -1 ? nextUnsaved : currentStudentIndex + 1)
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) { setError("Pilih siswa terlebih dahulu"); return }
    const invalid = assessmentRows.filter((row) => !row.objectiveId || !row.activityContext || !row.score)
    if (invalid.length > 0) { setError("Lengkapi semua data penilaian"); return }
    if (!pendingImageFile && !existingImageUrl) { setShowNoPhotoDialog(true); return }
    await doSave()
  }

  if (loadingStudents || loadingObjectives) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </CardContent>
      </Card>
    )
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Tidak ada siswa di kelas ini</p>
        </CardContent>
      </Card>
    )
  }

  if (lessonPlanItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada rencana pembelajaran untuk tanggal ini
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <AlertDialog open={showNoPhotoDialog} onOpenChange={setShowNoPhotoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lewati foto aktivitas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apa anda yakin tidak mengambil gambar aktivitas anak?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowNoPhotoDialog(false); doSave() }}>
              Ya, lanjutkan tanpa foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 w-full max-w-full">
        <Card className="overflow-hidden">
          <CardContent className="p-2 sm:p-3">
            {/* Progress header */}
            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Progress Penilaian Keseluruhan</div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 shrink-0",
                    onProgressClick && savedCount > 0 && "cursor-pointer hover:bg-accent"
                  )}
                  onClick={() => { if (onProgressClick && savedCount > 0) onProgressClick() }}
                >
                  {savedCount} dari {totalStudents} siswa
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Progress value={progressPercentage} className="h-1 sm:h-1.5 flex-1" />
                <span className="text-[9px] sm:text-[10px] font-medium tabular-nums text-muted-foreground min-w-[28px] sm:min-w-[32px] text-right">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            <Separator />

            {/* Student navigation */}
            <div className="mb-2 mt-2 sm:mb-3">
              <div className="text-sm mb-2 font-semibold">Siswa</div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentStudentIndex((i) => i - 1)}
                  disabled={currentStudentIndex === 0}
                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                >
                  <IconChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <StudentSelector
                    students={students}
                    selectedStudent={selectedStudent}
                    onStudentSelect={(s) => {
                      const idx = students.findIndex((x) => x.id === s.id)
                      if (idx !== -1) setCurrentStudentIndex(idx)
                    }}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentStudentIndex((i) => i + 1)}
                  disabled={currentStudentIndex === totalStudents - 1}
                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                >
                  <IconChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                  {currentStudentIndex + 1}/{totalStudents}
                </div>
              </div>
            </div>

            {selectedStudent && (
              <>
                <AssessmentScoreTable
                  rows={assessmentRows}
                  onUpdate={updateAssessmentRow}
                  loading={loading}
                />

                <AssessmentSummarySection
                  summary={summary}
                  onSummaryChange={setSummary}
                  generateChecked={generateSummaryChecked}
                  onGenerateCheckedChange={setGenerateSummaryChecked}
                  loading={loading}
                  generating={generatingSummary}
                  onGenerate={handleGenerateSummary}
                />

                {/*
                  key={selectedStudent.id} remounts the component on student switch,
                  clearing its internal previewUrl state.
                */}
                <AssessmentPhotoCapture
                  key={selectedStudent.id}
                  existingImageUrl={existingImageUrl}
                  uploading={uploadingImage}
                  disabled={loading}
                  onChange={(file, clearExisting) => {
                    setPendingImageFile(file)
                    if (clearExisting) setExistingImageUrl(null)
                  }}
                />

                {error && (
                  <div className="flex items-center gap-1.5 sm:gap-2 rounded-md bg-destructive/10 p-1.5 sm:p-2 text-[10px] sm:text-[11px] text-destructive mb-2">
                    <IconAlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-7 sm:h-8 text-[11px] sm:text-xs" disabled={loading}>
                  {loading
                    ? <IconLoader2 className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                    : <IconDeviceFloppy className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  }
                  {isLastStudent ? "Simpan & Selesai" : "Simpan & Lanjut"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </>
  )
}
