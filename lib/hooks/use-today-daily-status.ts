"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

interface Classroom {
  id: string
  name: string
  academicYear: string
  createdAt?: string
}

interface DailyStatusResponse {
  classroomId: string
  date: string
  lessonPlan: {
    isCreated: boolean
    topic?: string
    subtopic?: string
  }
  checkIn: {
    isConducted: boolean
    completedCount: number
    totalStudents: number
  }
  assessment: {
    completedCount: number
    totalStudents: number
    progressPercentage: number
  }
  checkOut: {
    isConducted: boolean
    completedCount: number
    totalStudents: number
  }
}

export interface TodayStatusItem {
  /** true when all classrooms have this item fully completed */
  done: boolean
  completedCount: number
  totalStudents: number
  progressPercentage: number
  /** classroom ID of the first classroom still missing this item */
  firstIncompleteClassroomId: string | null
}

export interface TodayDailyStatus {
  checkIn: TodayStatusItem
  assessment: TodayStatusItem
  checkOut: TodayStatusItem
  isLoading: boolean
}

function emptyItem(): TodayStatusItem {
  return {
    done: true,
    completedCount: 0,
    totalStudents: 0,
    progressPercentage: 100,
    firstIncompleteClassroomId: null,
  }
}

export function useTodayDailyStatus(classrooms: Classroom[]): TodayDailyStatus {
  const [status, setStatus] = useState<Omit<TodayDailyStatus, "isLoading">>({
    checkIn: emptyItem(),
    assessment: emptyItem(),
    checkOut: emptyItem(),
  })
  const [isLoading, setIsLoading] = useState(true)

  // Stable string key to avoid infinite re-renders when the array reference changes.
  const classroomIds = classrooms.map((c) => c.id).join(",")

  useEffect(() => {
    if (classrooms.length === 0) {
      setStatus({ checkIn: emptyItem(), assessment: emptyItem(), checkOut: emptyItem() })
      setIsLoading(false)
      return
    }

    const abortController = new AbortController()
    const today = format(new Date(), "yyyy-MM-dd")

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          classrooms.map((c) =>
            fetch(`/api/daily-status?classroomId=${c.id}&date=${today}`, {
              signal: abortController.signal,
              cache: "no-store",
            }).then((r) => (r.ok ? (r.json() as Promise<DailyStatusResponse>) : null))
          )
        )

        const valid = results.filter((r): r is DailyStatusResponse => r !== null)

        // Aggregate across all classrooms
        const checkIn: TodayStatusItem = {
          done: valid.every((r) => r.checkIn.isConducted),
          completedCount: valid.reduce((s, r) => s + r.checkIn.completedCount, 0),
          totalStudents: valid.reduce((s, r) => s + r.checkIn.totalStudents, 0),
          progressPercentage: 0,
          firstIncompleteClassroomId:
            valid.find((r) => !r.checkIn.isConducted)?.classroomId ?? null,
        }
        checkIn.progressPercentage = checkIn.totalStudents
          ? (checkIn.completedCount / checkIn.totalStudents) * 100
          : 100

        const assessment: TodayStatusItem = {
          done: valid.every((r) => r.assessment.progressPercentage === 100),
          completedCount: valid.reduce((s, r) => s + r.assessment.completedCount, 0),
          totalStudents: valid.reduce((s, r) => s + r.assessment.totalStudents, 0),
          progressPercentage: 0,
          firstIncompleteClassroomId:
            valid.find((r) => r.assessment.progressPercentage < 100)?.classroomId ?? null,
        }
        assessment.progressPercentage = assessment.totalStudents
          ? (assessment.completedCount / assessment.totalStudents) * 100
          : 100

        const checkOut: TodayStatusItem = {
          done: valid.every((r) => r.checkOut.isConducted),
          completedCount: valid.reduce((s, r) => s + r.checkOut.completedCount, 0),
          totalStudents: valid.reduce((s, r) => s + r.checkOut.totalStudents, 0),
          progressPercentage: 0,
          firstIncompleteClassroomId:
            valid.find((r) => !r.checkOut.isConducted)?.classroomId ?? null,
        }
        checkOut.progressPercentage = checkOut.totalStudents
          ? (checkOut.completedCount / checkOut.totalStudents) * 100
          : 100

        setStatus({ checkIn, assessment, checkOut })
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        setStatus({ checkIn: emptyItem(), assessment: emptyItem(), checkOut: emptyItem() })
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
