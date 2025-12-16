"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { DateController } from "@/components/assessment/date-controller"
import { IconHome, IconSchool } from "@tabler/icons-react"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"
import { LessonPlanAssessmentTable } from "@/components/assessment"

export default function StudentAssessmentPage() {
  const { user, classrooms, loading } = useCurrentUser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Build classroom description
  const getClassroomDescription = () => {
    if (loading) {
      return "Memuat data kelas..."
    }

    if (classrooms.length === 0) {
      return "Anda belum di-assign ke rombongan belajar manapun"
    }

    if (classrooms.length === 1) {
      return `Halaman penilaian peserta didik kelas: ${classrooms[0].name}`
    }

    // If teacher has multiple classrooms
    const classroomNames = classrooms.map(c => c.name).join(", ")
    return `Halaman penilaian peserta didik kelas: ${classroomNames}`
  }

  // Show loading state
  if (loading) {
    return (
      <>
        <PageHeader
          title="Penilaian Peserta Didik"
          description="Memuat data..."
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Penilaian", href: "/teacher/assesment", icon: IconSchool },
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
          title="Penilaian Peserta Didik"
          description={getClassroomDescription()}
          breadcrumbs={[
            { label: "Beranda", href: "/teacher", icon: IconHome },
            { label: "Penilaian", href: "/teacher/assesment", icon: IconSchool },
          ]}
        />
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
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Penilaian Peserta Didik"
        description={getClassroomDescription()}
        breadcrumbs={[
          { label: "Beranda", href: "/teacher", icon: IconHome },
          { label: "Penilaian", href: "/teacher/assesment", icon: IconSchool },
        ]}
      />
      
      <div className="space-y-4">
        <DateController 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Future components will be added here based on the selected date */}
        <Card>
          <CardContent className="py-8">
            <LessonPlanAssessmentTable 
              items={[]}
              showEmptyState={false}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}