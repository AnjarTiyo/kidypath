"use client"

import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconSchool } from "@tabler/icons-react"
import { ClassroomTableWrapper } from "./classroom-table-wrapper"
import { ClassroomPageActions } from "./classroom-page-actions"

export function ClassroomManagementPage() {
  return (
    <ClassroomTableWrapper
      renderHeader={(onRefresh) => (
        <PageHeader
          title="Manajemen Kelas"
          description="Kelola data kelas dan penugasan guru"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin", icon: IconHome },
            { label: "Kelas", icon: IconSchool },
          ]}
          actions={<ClassroomPageActions onRefresh={onRefresh} />}
        />
      )}
    />
  )
}
