import { eachDayOfInterval, isWeekend, format } from "date-fns"

/**
 * Returns true if the given date is a day-off.
 * A day is considered a day-off if it is a weekend (Saturday/Sunday)
 * or if it is listed in the provided dayOffDates array.
 */
export function isDayOff(date: Date, dayOffDates: string[]): boolean {
  if (isWeekend(date)) return true
  const dateStr = format(date, "yyyy-MM-dd")
  return dayOffDates.includes(dateStr)
}

/**
 * Returns all active school-day date strings (yyyy-MM-dd) in [start, end],
 * excluding weekends and any dates in dayOffDates.
 */
export function getSchoolDays(start: string, end: string, dayOffDates: string[]): string[] {
  const dayOffSet = new Set(dayOffDates)
  return eachDayOfInterval({ start: new Date(start), end: new Date(end) })
    .filter((d) => !isWeekend(d) && !dayOffSet.has(format(d, "yyyy-MM-dd")))
    .map((d) => format(d, "yyyy-MM-dd"))
}

/**
 * Counts active school days in [start, end], excluding weekends and dayOffDates.
 */
export function countSchoolDays(start: string, end: string, dayOffDates: string[]): number {
  return getSchoolDays(start, end, dayOffDates).length
}
