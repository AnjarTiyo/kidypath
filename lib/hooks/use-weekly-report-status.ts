"use client"

import { useEffect, useState } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"

interface Classroom {
  id: string
  name: string
  academicYear: string
  createdAt?: string
}

interface WeeklyReportRow {
  id: string
  studentId: string | null
  weekStart: string | null
  weekEnd: string | null
  isPublished: boolean | null
  sentAt: string | null
}

export interface WeeklyReportStatus {
  totalStudents: number
  publishedCount: number
  sentCount: number
  publishedPercentage: number
  sentPercentage: number
  isLoading: boolean
}

export function useWeeklyReportStatus(classrooms: Classroom[]): WeeklyReportStatus {
  const [status, setStatus] = useState<Omit<WeeklyReportStatus, "isLoading">>({
    totalStudents: 0,
    publishedCount: 0,
    sentCount: 0,
    publishedPercentage: 0,
    sentPercentage: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const classroomIds = classrooms.map((c) => c.id).join(",")

  useEffect(() => {
    // Only fetch on Friday (5) or Saturday (6) — no point loading on other days
    const dayOfWeek = new Date().getDay()
    const isWeekEnd = dayOfWeek === 5 || dayOfWeek === 6

    if (!isWeekEnd || classrooms.length === 0) {
      setStatus({ totalStudents: 0, publishedCount: 0, sentCount: 0, publishedPercentage: 0, sentPercentage: 0 })
      setIsLoading(false)
      return
    }

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

    const abortController = new AbortController()

    const fetchAll = async () => {
      try {
        // Fetch reports + student counts for all classrooms in parallel
        const results = await Promise.all(
          classrooms.map((c) =>
            Promise.all([
              fetch(`/api/reports/weekly?classroomId=${c.id}`, {
                signal: abortController.signal,
                cache: "no-store",
              }).then((r) => (r.ok ? r.json() : null)),
              fetch(`/api/students?classroomId=${c.id}`, {
                signal: abortController.signal,
                cache: "no-store",
              }).then((r) => (r.ok ? r.json() : null)),
            ])
          )
        )

        let totalStudents = 0
        let publishedCount = 0
        let sentCount = 0

        for (const [reportsRes, studentsRes] of results) {
          const students: { id: string }[] = studentsRes?.data ?? []
          totalStudents += students.length

          const allReports: WeeklyReportRow[] = reportsRes?.data ?? []
          const weekReports = allReports.filter(
            (r) => r.weekStart === weekStart && r.weekEnd === weekEnd
          )

          publishedCount += weekReports.filter((r) => r.isPublished === true).length
          sentCount += weekReports.filter((r) => r.sentAt != null).length
        }

        const publishedPercentage = totalStudents > 0 ? Math.round((publishedCount / totalStudents) * 100) : 0
        const sentPercentage = totalStudents > 0 ? Math.round((sentCount / totalStudents) * 100) : 0

        setStatus({ totalStudents, publishedCount, sentCount, publishedPercentage, sentPercentage })
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        setStatus({ totalStudents: 0, publishedCount: 0, sentCount: 0, publishedPercentage: 0, sentPercentage: 0 })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()

    return () => {
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomIds])

  return { ...status, isLoading }
}
