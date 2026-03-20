"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { IconLoader2, IconPencil, IconCheck, IconSearch, IconUser } from "@tabler/icons-react"

interface AssessmentSummaryProps {
  classroomName: string
  date: string
  assessments: AssessmentRecord[]
  totalStudents: number
  students?: Student[]
  onEdit: (studentId: string) => void
  onContinue: () => void
  loading?: boolean
}

interface Student {
  id: string
  fullName: string
  name?: string // For backward compatibility
}

interface AssessmentRecord {
  id: string
  studentId: string
  studentName: string | null
  scopeName: string | null
  score: string | null
  note: string | null
}

type FilterStatus = "all" | "assessed" | "not-assessed"

const SCORE_LABELS: Record<string, string> = {
  BB: "Belum Berkembang",
  MB: "Mulai Berkembang",
  BSH: "Berkembang Sesuai Harapan",
  BSB: "Berkembang Sangat Baik",
}

const SCORE_COLORS: Record<string, string> = {
  BB: "bg-red-100 text-red-700 border-red-200",
  MB: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BSH: "bg-blue-100 text-blue-700 border-blue-200",
  BSB: "bg-green-100 text-green-700 border-green-200",
}

// Map backend scope names to Indonesian frontend labels
const SCOPE_NAME_MAP: Record<string, string> = {
  "Nilai Agama dan Moral": "Nilai Agama dan Moral",
  "Fisik Motorik": "Fisik Motorik",
  "Kognitif": "Kognitif",
  "Bahasa": "Bahasa",
  "Sosial Emosional": "Sosial Emosional",
  "Seni": "Seni",
  // Add fallback for any English names that might come from backend
  "religious_moral": "Nilai Agama dan Moral",
  "physical_motor": "Fisik Motorik",
  "cognitive": "Kognitif",
  "language": "Bahasa",
  "social_emotional": "Sosial Emosional",
  "art": "Seni",
}

const getScopeDisplayName = (scopeName: string | null): string => {
  if (!scopeName) return ""
  return SCOPE_NAME_MAP[scopeName] || scopeName
}

export function AssessmentSummary({
  classroomName,
  date,
  assessments,
  totalStudents,
  students = [],
  onEdit,
  onContinue,
  loading = false,
}: AssessmentSummaryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")

  // Group assessments by student
  const studentAssessments = assessments.reduce((acc, assessment) => {
    const studentId = assessment.studentId
    if (!acc[studentId]) {
      acc[studentId] = {
        studentId,
        studentName: assessment.studentName || "Unknown",
        assessments: [],
      }
    }
    acc[studentId].assessments.push(assessment)
    return acc
  }, {} as Record<string, { studentId: string; studentName: string; assessments: AssessmentRecord[] }>)

  // Create a complete student list with assessment status
  const allStudents = students.map(student => ({
    id: student.id,
    name: student.fullName || student.name || '',
    isAssessed: studentAssessments.hasOwnProperty(student.id),
    assessments: studentAssessments[student.id]?.assessments || [],
  }))

  // Sort: assessed students first, then unassessed
  const sortedStudents = allStudents.sort((a, b) => {
    if (a.isAssessed && !b.isAssessed) return -1
    if (!a.isAssessed && b.isAssessed) return 1
    return a.name.localeCompare(b.name)
  })

  // Filter students based on search and status
  const filteredStudents = sortedStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "assessed" && student.isAssessed) ||
      (filterStatus === "not-assessed" && !student.isAssessed)
    
    return matchesSearch && matchesStatus
  })

  const completedCount = Object.keys(studentAssessments).length
  const progressPercentage = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat ringkasan penilaian...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Summary Card - col-span-1 */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Ringkasan Penilaian</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Rombel: <span className="uppercase">{classroomName}</span> • {date}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-center py-4">
              {/* <div className="text-4xl font-bold mb-1">{completedCount} <span className="text-md">dari</span> {totalStudents}</div> */}
              <div className="flex flex-row gap-3 items-center mb-1 justify-center">
                <span className="text-3xl font-bold">{completedCount} </span>
                <span>dari</span>
                <span className="text-3xl text-primary font-bold">{totalStudents}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Siswa Dinilai</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums">{progressPercentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-3">
          {completedCount < totalStudents ? (
            <Button onClick={onContinue} className="w-full h-9 text-xs">
              {completedCount === 0 ? "Mulai Penilaian" : "Lanjutkan Penilaian"}
            </Button>
          ) : (
            <div className="text-center py-2 text-xs text-green-600 font-medium w-full bg-green-50 rounded-md border border-green-200">
              ✓ Penilaian untuk semua siswa telah selesai
            </div>
          )}
        </div>
      </div>

      {/* Student List Card - col-span-2 */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm">Daftar Siswa</CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredStudents.length} dari {sortedStudents.length}
              </Badge>
            </div>
            
            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value as FilterStatus)}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="assessed" className="text-xs">Sudah Dinilai</SelectItem>
                  <SelectItem value="not-assessed" className="text-xs">Belum Dinilai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
              <div className="space-y-1.5 p-3 pt-0">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {sortedStudents.length === 0 ? (
                      <>
                        <p className="mb-1">Tidak ada siswa di kelas ini</p>
                        <p className="text-[10px]">Tambahkan siswa terlebih dahulu</p>
                      </>
                    ) : (
                      <p>Tidak ada siswa yang sesuai dengan pencarian</p>
                    )}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <Card key={student.id} className={`border ${!student.isAssessed ? 'bg-muted/20' : ''}`}>
                      <CardContent className="p-2">
                        <div className="flex items-start gap-2">
                          {/* User Avatar Placeholder */}
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <IconUser className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs flex items-center gap-1.5">
                                  {student.isAssessed ? (
                                    <IconCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                  ) : (
                                    <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {student.name}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {student.isAssessed 
                                    ? `${student.assessments.length} aspek perkembangan` 
                                    : 'Belum dinilai'}
                                </div>
                              </div>
                              {student.isAssessed ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEdit(student.id)}
                                  className="h-6 text-[11px] px-2 shrink-0 ml-2"
                                >
                                  <IconPencil className="h-3 w-3 mr-1" />
                                  Ubah
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => onEdit(student.id)}
                                  className="h-6 text-[11px] px-2 shrink-0 ml-2"
                                >
                                  Nilai
                                </Button>
                              )}
                            </div>

                            {student.isAssessed && (
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-0">
                                  <AccordionTrigger className="py-1 text-[10px] text-muted-foreground hover:no-underline">
                                    Lihat Detail Penilaian
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid grid-cols-2 gap-1 pt-1">
                                      {student.assessments.map((assessment) => (
                                        <div
                                          key={assessment.id}
                                          className="flex items-center justify-between gap-1 p-1.5 bg-muted/50 rounded text-[10px]"
                                        >
                                          <span className="truncate flex-1 leading-tight">
                                            {getScopeDisplayName(assessment.scopeName)}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] px-1 py-0 h-4 leading-none ${
                                              SCORE_COLORS[assessment.score || ""] || ""
                                            }`}
                                          >
                                            {assessment.score}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Future summary placeholder */}
                                    <div className="mt-2 p-2 bg-muted/30 rounded text-[10px] text-muted-foreground italic">
                                      Ringkasan penilaian akan ditampilkan di sini
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
