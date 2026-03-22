"use client"

import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconSchool } from "@tabler/icons-react"
import { StudentTableWrapper } from "./student-table-wrapper"
import { StudentPageActions } from "./student-page-actions"

export function StudentManagementPage() {
  return (
    <StudentTableWrapper
      renderHeader={(onRefresh) => (
        <PageHeader
          title="Manajemen Siswa"
          description="Kelola data siswa, tugaskan ke kelas, dan hubungkan dengan orang tua"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin", icon: IconHome },
            { label: "Siswa", icon: IconSchool },
          ]}
          actions={<StudentPageActions onRefresh={onRefresh} />}
        />
      )}
    />
  )
}
