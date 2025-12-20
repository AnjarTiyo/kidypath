"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

export interface LessonPlanItem {
  id: string
  developmentScope: string
  learningGoal: string
  activityContext: string
}

interface DevelopmentScope {
  id: string
  name: string
  label?: string
}

interface LearningObjective {
  id: string
  scopeId: string
  description: string
}

type AssessmentScore = "BB" | "MB" | "BSH" | "BSB"

interface AssessmentRow {
  scopeId: string
  scopeName: string
  objectiveId: string
  objectiveDescription: string
  activityContext: string
  score: AssessmentScore
  note: string
}

interface ExistingAssessment {
  id: string
  studentId: string
  scopeId: string
  objectiveId: string
  activityContext: string
  score: AssessmentScore
  note: string | null
}

const DEVELOPMENT_SCOPES: DevelopmentScope[] = [
  { id: "religious_moral", name: "religious_moral", label: "Nilai Agama dan Moral" },
  { id: "physical_motor", name: "physical_motor", label: "Fisik Motorik" },
  { id: "cognitive", name: "cognitive", label: "Kognitif" },
  { id: "language", name: "language", label: "Bahasa" },
  { id: "social_emotional", name: "social_emotional", label: "Sosial Emosional" },
  { id: "art", name: "art", label: "Seni" },
]

// Helper function to get display label for a scope
const getScopeLabel = (scopeName: string): string => {
  const labelMap: Record<string, string> = {
    religious_moral: "Nilai Agama dan Moral",
    physical_motor: "Fisik Motorik",
    cognitive: "Kognitif",
    language: "Bahasa",
    social_emotional: "Sosial Emosional",
    art: "Seni",
  }
  return labelMap[scopeName] || scopeName
}

const SCORE_OPTIONS: { value: AssessmentScore; label: string }[] = [
  { value: "BB", label: "BB - Belum Berkembang" },
  { value: "MB", label: "MB - Mulai Berkembang" },
  { value: "BSH", label: "BSH - Berkembang Sesuai Harapan" },
  { value: "BSB", label: "BSB - Berkembang Sangat Baik" },
]

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
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [existingAssessments, setExistingAssessments] = useState<Map<string, ExistingAssessment[]>>(new Map())
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([])
  const [developmentScopes, setDevelopmentScopes] = useState<DevelopmentScope[]>([])
  const [assessmentRows, setAssessmentRows] = useState<AssessmentRow[]>([])

  const formattedDate = format(date, "EEEE, dd MMM yyyy", { locale: localeId })
  const selectedStudent = students[currentStudentIndex] || null
  const totalStudents = students.length
  const isLastStudent = currentStudentIndex === totalStudents - 1
  const progressPercentage = totalStudents > 0 ? Math.round((savedCount / totalStudents) * 100) : 0

  // Fetch learning objectives and development scopes
  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        setLoadingObjectives(true)
        
        // Fetch learning objectives
        const objectivesResponse = await fetch('/api/learning-objectives')
        if (objectivesResponse.ok) {
          const objectivesData = await objectivesResponse.json()
          setLearningObjectives(objectivesData.data || [])
        }
        
        // Fetch development scopes
        const scopesResponse = await fetch('/api/development-scopes')
        if (scopesResponse.ok) {
          const scopesData = await scopesResponse.json()
          setDevelopmentScopes(scopesData.data || [])
        }
      } catch (error) {
        console.error("Error fetching objectives:", error)
      } finally {
        setLoadingObjectives(false)
      }
    }

    fetchObjectives()
  }, [])

  // Initialize assessment rows from lesson plan items
  useEffect(() => {
    if (lessonPlanItems.length > 0 && learningObjectives.length > 0 && developmentScopes.length > 0) {
      const rows: AssessmentRow[] = lessonPlanItems.map((item) => {
        // Find the scope from database by name
        const scope = developmentScopes.find(s => s.name === item.developmentScope)
        const scopeObjectives = learningObjectives.filter(obj => obj.scopeId === scope?.id)
        const defaultObjective = scopeObjectives[0]

        return {
          scopeId: scope?.id || "",
          scopeName: getScopeLabel(item.developmentScope),
          objectiveId: defaultObjective?.id || "",
          objectiveDescription: item.learningGoal,
          activityContext: item.activityContext,
          score: "BSH" as AssessmentScore,
          note: "",
        }
      })
      setAssessmentRows(rows)
    }
  }, [lessonPlanItems, learningObjectives, developmentScopes])

  // Fetch students and existing assessments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStudents(true)

        const studentsResponse = await fetch(
          `/api/students?classroom=${classroomId}&pageSize=100`
        )

        const formattedDate = format(date, "yyyy-MM-dd")
        const assessmentsResponse = await fetch(
          `/api/assessments?classroomId=${classroomId}&date=${formattedDate}`
        )

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          const studentsList = studentsData.data || []
          setStudents(studentsList)

          if (assessmentsResponse.ok) {
            const assessmentsData = await assessmentsResponse.json()
            const assessmentsList = assessmentsData.data || []

            const assessmentsMap = new Map<string, ExistingAssessment[]>()
            assessmentsList.forEach((ass: any) => {
              const existing = assessmentsMap.get(ass.studentId) || []
              existing.push({
                id: ass.id,
                studentId: ass.studentId,
                scopeId: ass.scopeId,
                objectiveId: ass.objectiveId,
                activityContext: ass.activityContext,
                score: ass.score,
                note: ass.note,
              })
              assessmentsMap.set(ass.studentId, existing)
            })
            setExistingAssessments(assessmentsMap)

            // Count unique students with assessments
            setSavedCount(assessmentsMap.size)

            if (editStudentId) {
              const index = studentsList.findIndex((s: Student) => s.id === editStudentId)
              if (index !== -1) {
                setCurrentStudentIndex(index)
              }
            } else {
              const firstUnsavedIndex = studentsList.findIndex(
                (s: Student) => !assessmentsMap.has(s.id)
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

    if (lessonPlanItems.length > 0) {
      fetchData()
    }
  }, [classroomId, date, editStudentId, lessonPlanItems.length])

  // Load existing assessment data when student changes
  useEffect(() => {
    if (selectedStudent && existingAssessments.has(selectedStudent.id)) {
      const existing = existingAssessments.get(selectedStudent.id)!
      const updatedRows = assessmentRows.map(row => {
        const existingRow = existing.find(e => e.scopeId === row.scopeId)
        if (existingRow) {
          return {
            ...row,
            objectiveId: existingRow.objectiveId,
            activityContext: existingRow.activityContext,
            score: existingRow.score,
            note: existingRow.note || "",
          }
        }
        return row
      })
      setAssessmentRows(updatedRows)
    } else if (lessonPlanItems.length > 0 && assessmentRows.length > 0) {
      // Reset to lesson plan defaults
      const resetRows = lessonPlanItems.map((item, idx) => {
        const existingRow = assessmentRows[idx]
        return {
          ...existingRow,
          activityContext: item.activityContext,
          score: "BSH" as AssessmentScore,
          note: "",
        }
      })
      setAssessmentRows(resetRows)
    }
    setError(null)
  }, [currentStudentIndex, selectedStudent, existingAssessments])

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

  const updateAssessmentRow = (index: number, field: keyof AssessmentRow, value: string) => {
    setAssessmentRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent) {
      setError("Pilih siswa terlebih dahulu")
      return
    }

    // Validate all rows have required data (all should be populated from lesson plan)
    // activityContext and score are from lesson plan defaults
    // objectiveId should be populated from database learning objectives
    const invalidRows = assessmentRows.filter(
      row => !row.objectiveId || !row.activityContext || !row.score
    )
    if (invalidRows.length > 0) {
      console.error('Invalid rows:', invalidRows)
      setError("Lengkapi semua data penilaian")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Save all assessment rows
      const promises = assessmentRows.map(row =>
        fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudent.id,
            date: format(date, "yyyy-MM-dd"),
            scopeId: row.scopeId,
            objectiveId: row.objectiveId,
            activityContext: row.activityContext,
            score: row.score,
            note: row.note.trim() || null,
          }),
        })
      )

      const responses = await Promise.all(promises)
      const allSuccess = responses.every(r => r.ok)

      if (!allSuccess) {
        setError("Terjadi kesalahan saat menyimpan beberapa penilaian")
        return
      }

      // Update existing assessments map
      const updatedMap = new Map(existingAssessments)
      const studentAssessments = assessmentRows.map(row => ({
        id: "", // Will be from response
        studentId: selectedStudent.id,
        scopeId: row.scopeId,
        objectiveId: row.objectiveId,
        activityContext: row.activityContext,
        score: row.score,
        note: row.note.trim() || null,
      }))
      updatedMap.set(selectedStudent.id, studentAssessments)
      setExistingAssessments(updatedMap)
      setSavedCount(updatedMap.size)

      onSuccess?.()

      if (isLastStudent) {
        onComplete?.()
      } else {
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
      console.error("Error saving assessments:", error)
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
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
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 w-full max-w-full">
      <Card className="overflow-hidden">
        <CardContent className="p-2 sm:p-3">
          {/* Compact Header with Progress */}
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="text-[10px] sm:text-xs min-w-0">
                  <div className="font-medium truncate">{classroomName}</div>
                  <div className="text-muted-foreground truncate">{formattedDate}</div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 shrink-0",
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
            </div>

            {/* Compact Progress Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Progress value={progressPercentage} className="h-1 sm:h-1.5 flex-1" />
              <span className="text-[9px] sm:text-[10px] font-medium tabular-nums text-muted-foreground min-w-[28px] sm:min-w-[32px] text-right">
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Compact Student Navigation */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePreviousStudent}
                disabled={currentStudentIndex === 0}
                className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
              >
                <IconChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>

              <div className="flex-1 min-w-0">
                <StudentSelector
                  students={students}
                  selectedStudent={selectedStudent}
                  onStudentSelect={(student) => {
                    const index = students.findIndex((s) => s.id === student.id)
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
              {/* Compact Assessment Table with Sticky Header */}
              <div className="mb-2 sm:mb-3 -mx-2 sm:-mx-3">
                <div className="border-y sm:border sm:rounded-md overflow-hidden">
                  {/* Scrollable container for both header and body */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px] sm:min-w-[800px]">
                      {/* Scrollable Body with Sticky Header */}
                      <div className="max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-380px)] overflow-y-auto">
                        <table className="w-full text-[10px] sm:text-[11px] table-fixed">
                          <colgroup>
                            <col className="w-[100px] sm:w-[120px]" />
                            <col className="w-[150px] sm:w-[180px]" />
                            <col className="w-[180px] sm:w-[200px]" />
                            <col className="w-[30px] sm:w-[35px]" />
                            <col className="w-[30px] sm:w-[35px]" />
                            <col className="w-[30px] sm:w-[35px]" />
                            <col className="w-[30px] sm:w-[35px]" />
                            <col className="w-[140px] sm:w-[160px]" />
                          </colgroup>
                          <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                              <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium border-r align-middle">
                                Lingkup
                              </th>
                              <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium border-r align-middle">
                                Tujuan
                              </th>
                              <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium border-r align-middle">
                                Konteks
                              </th>
                              <th colSpan={4} className="text-center px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium border-r border-b">
                                Capaian
                              </th>
                              <th rowSpan={2} className="text-left px-1.5 sm:px-2 py-1 sm:py-1.5 font-medium align-middle">
                                Catatan
                              </th>
                            </tr>
                            <tr className="bg-muted">
                              <th className="text-center px-0.5 sm:px-1 py-0.5 sm:py-1 font-medium border-r">
                                <span className="text-[9px] sm:text-[10px]">BB</span>
                              </th>
                              <th className="text-center px-0.5 sm:px-1 py-0.5 sm:py-1 font-medium border-r">
                                <span className="text-[9px] sm:text-[10px]">MB</span>
                              </th>
                              <th className="text-center px-0.5 sm:px-1 py-0.5 sm:py-1 font-medium border-r">
                                <span className="text-[9px] sm:text-[10px]">BSH</span>
                              </th>
                              <th className="text-center px-0.5 sm:px-1 py-0.5 sm:py-1 font-medium border-r">
                                <span className="text-[9px] sm:text-[10px]">BSB</span>
                              </th>
                            </tr>
                          </thead>
                          <TooltipProvider>
                            <tbody>
                              {assessmentRows.map((row, index) => (
                                <tr key={index} className="border-t hover:bg-muted/50">
                                  <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top border-r">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="font-medium leading-tight truncate cursor-help">
                                          {row.scopeName}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-xs">{row.scopeName}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                  <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top border-r">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="leading-tight line-clamp-2 cursor-help">
                                          {row.objectiveDescription}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-sm">
                                        <p className="text-xs">{row.objectiveDescription}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                  <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top border-r">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="leading-tight line-clamp-3 cursor-help whitespace-pre-wrap">
                                          {row.activityContext}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-md">
                                        <p className="text-xs whitespace-pre-wrap">{row.activityContext}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                  {/* BB Checkbox */}
                                  <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 align-middle text-center border-r">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={row.score === "BB"}
                                        onCheckedChange={() => updateAssessmentRow(index, "score", "BB")}
                                        disabled={loading}
                                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                      />
                                    </div>
                                  </td>
                                  {/* MB Checkbox */}
                                  <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 align-middle text-center border-r">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={row.score === "MB"}
                                        onCheckedChange={() => updateAssessmentRow(index, "score", "MB")}
                                        disabled={loading}
                                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                      />
                                    </div>
                                  </td>
                                  {/* BSH Checkbox */}
                                  <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 align-middle text-center border-r">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={row.score === "BSH"}
                                        onCheckedChange={() => updateAssessmentRow(index, "score", "BSH")}
                                        disabled={loading}
                                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                      />
                                    </div>
                                  </td>
                                  {/* BSB Checkbox */}
                                  <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 align-middle text-center border-r">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={row.score === "BSB"}
                                        onCheckedChange={() => updateAssessmentRow(index, "score", "BSB")}
                                        disabled={loading}
                                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-1.5 sm:px-2 py-1 sm:py-1.5 align-top">
                                    <Textarea
                                      value={row.note}
                                      onChange={(e) => updateAssessmentRow(index, "note", e.target.value)}
                                      placeholder="..."
                                      className="text-[10px] sm:text-[11px] min-h-[36px] sm:min-h-[40px] py-1 px-1.5 sm:px-2"
                                      disabled={loading}
                                      rows={2}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </TooltipProvider>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-md bg-destructive/10 p-1.5 sm:p-2 text-[10px] sm:text-[11px] text-destructive mb-2">
                  <IconAlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* Compact Submit Button */}
              <Button type="submit" className="w-full h-7 sm:h-8 text-[11px] sm:text-xs" disabled={loading}>
                {loading && <IconLoader2 className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />}
                {!loading && <IconDeviceFloppy className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                {isLastStudent ? `Simpan & Selesai` : `Simpan & Lanjut`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
