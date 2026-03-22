"use client"

import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconUsers } from "@tabler/icons-react"
import { UserTableWrapper } from "./user-table-wrapper"
import { UserPageActions } from "./user-page-actions"

export function UserManagementPage() {
  return (
    <UserTableWrapper
      renderHeader={(onRefresh) => (
        <PageHeader
          title="Manajemen Pengguna"
          description="Kelola akun pengguna, guru, dan orang tua"
          breadcrumbs={[
            { label: "Beranda", href: "/admin", icon: IconHome },
            { label: "Manajemen Pengguna", icon: IconUsers },
          ]}
          actions={<UserPageActions onRefresh={onRefresh} />}
        />
      )}
    />
  )
}
