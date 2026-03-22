import { CurrentTopicsPayload } from "@/lib/types/current-topics"

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

export function getAcademicYearFromDate(date: Date): string {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  if (month >= 7) {
    return `${year}/${year + 1}`
  }

  return `${year - 1}/${year}`
}

export function getSemesterNumberFromDate(date: Date): 1 | 2 {
  const month = date.getMonth() + 1
  return month >= 7 ? 1 : 2
}

export function getMonthNumberFromDate(date: Date): number {
  return date.getMonth() + 1
}

export function getWeekOfMonth(date: Date): number {
  const day = date.getDate()
  return Math.max(1, Math.ceil(day / 7))
}

export function getMonthName(monthNumber?: number | null): string {
  if (!monthNumber) {
    return ""
  }

  const idx = Math.max(0, Math.min(11, monthNumber - 1))
  return MONTH_NAMES[idx]
}

export function buildTopicContextSection(topics?: CurrentTopicsPayload | null): string {
  if (!topics) {
    return ""
  }

  const entries: string[] = []

  if (topics.semester) {
    const { semesterNumber, academicYear, title, description } = topics.semester
    const labelParts = [
      semesterNumber ? `Semester ${semesterNumber}` : "Semester"
    ]

    if (academicYear) {
      labelParts.push(academicYear)
    }

    const label = labelParts.join(" • ")
    entries.push(`${label}: ${title}${description ? ` – ${description}` : ""}`)
  }

  if (topics.monthly) {
    const { month, monthNumber, title, description } = topics.monthly
    const labelParts = []

    if (month) {
      labelParts.push(month)
    }

    if (monthNumber) {
      labelParts.push(`Bulan ke-${monthNumber}`)
    }

    const label = labelParts.join(", ") || "Topik Bulanan"
    entries.push(`${label}: ${title}${description ? ` – ${description}` : ""}`)
  }

  if (topics.weekly) {
    const { weekNumber, title, description } = topics.weekly
    const label = weekNumber ? `Minggu ${weekNumber}` : "Topik Mingguan"
    entries.push(`${label}: ${title}${description ? ` – ${description}` : ""}`)
  }

  return entries.join("\n")
}
