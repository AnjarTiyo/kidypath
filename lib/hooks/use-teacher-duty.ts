"use client"

import { useEffect, useState } from "react"

export type TeacherData = {
  id: string
  name: string | null
  email: string | null
  isCurriculumCoordinator: boolean | null
}

export function useTeacherDuty() {
  const [dutyTeachers, setDutyTeachers] = useState<TeacherData[]>([])
  const [allTeachers, setAllTeachers] = useState<TeacherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dutyRes, teachersRes] = await Promise.all([
        fetch("/api/teacher-duty"),
        fetch("/api/teacher-duty/teachers"),
      ])

      if (!dutyRes.ok) {
        const body = await dutyRes.json().catch(() => ({}))
        throw new Error(body.error ?? "Gagal memuat data guru piket")
      }
      if (!teachersRes.ok) {
        const body = await teachersRes.json().catch(() => ({}))
        throw new Error(body.error ?? "Gagal memuat daftar guru")
      }

      const { data: duty } = await dutyRes.json()
      const { data: teachers } = await teachersRes.json()

      setDutyTeachers(duty)
      setAllTeachers(teachers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { dutyTeachers, allTeachers, loading, error, refetch: fetchData }
}
