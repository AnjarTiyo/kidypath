import { NextRequest, NextResponse } from "next/server"
import { and, asc, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { semesterTopics } from "@/lib/db/schema"
import {
  getAcademicYearFromDate,
  getMonthName,
  getMonthNumberFromDate,
  getSemesterNumberFromDate,
  getWeekOfMonth,
} from "@/lib/helpers/topic-helpers"
import { CurrentTopicsPayload } from "@/lib/types/current-topics"

const ALLOWED_ROLES = ["admin", "curriculum", "teacher"]

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!ALLOWED_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const dateParam = request.nextUrl.searchParams.get("date")
  const selectedDate = dateParam ? new Date(dateParam) : new Date()
  if (Number.isNaN(selectedDate.getTime())) {
    return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 422 })
  }

  const academicYear = getAcademicYearFromDate(selectedDate)
  const semesterNumber = getSemesterNumberFromDate(selectedDate)
  const monthNumber = getMonthNumberFromDate(selectedDate)
  const weekNumber = getWeekOfMonth(selectedDate)

  const semester = await db.query.semesterTopics.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.academicYear, academicYear), eq(t.semesterNumber, semesterNumber)),
    with: {
      monthlyTopics: {
        where: (m, { eq }) => eq(m.monthNumber, monthNumber),
        orderBy: (m, { asc }) => [asc(m.monthNumber)],
        with: {
          weeklyTopics: {
            where: (w, { eq }) => eq(w.weekNumber, weekNumber),
            orderBy: (w, { asc }) => [asc(w.weekNumber)],
          },
        },
      },
    },
  })

  if (!semester) {
    return NextResponse.json({ data: null })
  }

  const monthlyTopic = semester.monthlyTopics[0] ?? null
  const weeklyTopic = monthlyTopic?.weeklyTopics[0] ?? null

  const resolvedMonthNumber = monthlyTopic?.monthNumber ?? monthNumber

  const data: CurrentTopicsPayload = {
    semester: {
      id: semester.id,
      title: semester.title,
      description: semester.description,
      academicYear: semester.academicYear,
      semesterNumber: semester.semesterNumber,
    },
    monthly: monthlyTopic
      ? {
          monthlyTopicId: monthlyTopic.id,
          title: monthlyTopic.title,
          description: monthlyTopic.description,
          monthNumber: monthlyTopic.monthNumber ?? null,
          month: getMonthName(resolvedMonthNumber),
        }
      : null,
    weekly: weeklyTopic
      ? {
          weeklyTopicId: weeklyTopic.id,
          title: weeklyTopic.title,
          description: weeklyTopic.description,
          weekNumber: weeklyTopic.weekNumber ?? null,
        }
      : null,
  }

  return NextResponse.json({ data })
}
