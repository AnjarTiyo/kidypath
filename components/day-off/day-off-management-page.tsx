"use client"

import { useCallback, useEffect, useState } from "react"
import { DayOffTable } from "./day-off-table"
import { DayOff } from "./day-off-columns"
import { PageHeader } from "@/components/layout/page-header"
import { IconCalendarOff, IconHome } from "@tabler/icons-react"
import { DayOffPageActions } from "./day-off-page-actions"

export function DayOffManagementPage() {
  const [dayOffs, setDayOffs] = useState<DayOff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchDayOffs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/day-offs")
      if (!response.ok) throw new Error("Failed to fetch")
      const result = await response.json()
      setDayOffs(result.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDayOffs()
  }, [fetchDayOffs])

  return (
    <>
      <PageHeader
        title="Manajemen Hari Libur"
        description="Kelola hari libur sekolah. Hari libur akan dikecualikan dari perhitungan hari efektif."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin", icon: IconHome },
          { label: "Hari Libur", icon: IconCalendarOff },
        ]}
        actions={<DayOffPageActions onRefresh={fetchDayOffs} />}
      />
      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-12">Memuat data...</div>
      ) : (
        <DayOffTable
          data={dayOffs}
          onRefresh={fetchDayOffs}
          search={search}
          onSearchChange={setSearch}
        />
      )}
    </>
  )
}
