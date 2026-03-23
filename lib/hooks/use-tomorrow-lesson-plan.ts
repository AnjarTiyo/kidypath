"use client"

import { useEffect, useState } from "react"
import { format, addDays } from "date-fns"

interface Classroom {
  id: string
  name: string
  academicYear: string
  createdAt?: string
}

interface LessonPlanEntry {
  id: string
  classroomId: string
}

interface LessonPlanResponse {
  data: LessonPlanEntry[]
}

/**
 * Returns the next working day (Mon–Sat) relative to `today`.
 * - Sunday  → null (no banner shown on Sundays)
 * - Saturday → Monday (+2 days)
 * - Mon–Fri  → next day (+1 day)
 */
function getNextWorkingDay(today: Date): Date | null {
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  if (dayOfWeek === 0) return null          // Sunday: no banner
  if (dayOfWeek === 6) return addDays(today, 2) // Saturday: check Monday
  return addDays(today, 1)                  // Mon–Fri: check tomorrow
}

export function useTomorrowLessonPlan(classrooms: Classroom[]) {
  const [missingClassrooms, setMissingClassrooms] = useState<Classroom[]>([])
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Stable string key — avoids re-running the effect when the array
  // reference changes but the classroom IDs are the same.
  const classroomIds = classrooms.map((c) => c.id).join(",")

  useEffect(() => {
    const classroomList = classrooms
    const today = new Date()
    const nextWorkingDay = getNextWorkingDay(today)

    if (!nextWorkingDay || classroomList.length === 0) {
      setTargetDate(nextWorkingDay)
      setMissingClassrooms([])
      setIsLoading(false)
      return
    }

    setTargetDate(nextWorkingDay)

    const abortController = new AbortController()

    const fetchPlans = async () => {
      try {
        const dateParam = format(nextWorkingDay, "yyyy-MM-dd")
        const response = await fetch(
          `/api/lesson-plans?date=${dateParam}&pageSize=50`,
          { signal: abortController.signal, cache: "no-store" }
        )

        if (!response.ok) {
          setMissingClassrooms([])
          return
        }

        const json: LessonPlanResponse = await response.json()
        const plannedClassroomIds = new Set(json.data.map((p) => p.classroomId))

        const missing = classroomList.filter((c) => !plannedClassroomIds.has(c.id))
        setMissingClassrooms(missing)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        setMissingClassrooms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()

    return () => {
      abortController.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomIds])

  return { targetDate, missingClassrooms, isLoading }
}
