"use client"

import { useState, useEffect } from "react"
import { id } from "date-fns/locale"
import { Calendar } from "../ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { IconCalendar } from "@tabler/icons-react"

interface LessonPlanCalendarProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
  lessonPlanDates: string[]
  dayOffDates?: string[] // Additional day-offs from Agenda entity (Sundays are always day-offs)
}

export default function LessonPlanCalendar({
  selectedDate,
  onDateSelect,
  lessonPlanDates,
  dayOffDates = [],
}: LessonPlanCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Count lesson plans in current month
  const lessonPlansThisMonth = lessonPlanDates.filter((date) => {
    const d = new Date(date)
    return (
      d.getMonth() === currentMonth.getMonth() &&
      d.getFullYear() === currentMonth.getFullYear()
    )
  }).length

  // Function to check if a date is Sunday
  const isSunday = (date: Date) => {
    return date.getDay() === 0
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 border-b h-18">
        <div className="p-2 bg-muted flex items-center justify-center aspect-square rounded-sm">
          <IconCalendar className="text-muted-foreground" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base">Kalender Rencana Pembelajaran</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Pilih tanggal untuk melihat atau membuat rencana pembelajaran
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-hidden">
        <div className="max-w-sm mx-auto pb-10">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            onMonthChange={setCurrentMonth}
            className="rounded-sm w-full"
            locale={id}
            modifiers={{
              hasLessonPlan: lessonPlanDates.map((date) => new Date(date)),
              dayOff: dayOffDates.map((date) => new Date(date)),
              sunday: isSunday,
            }}
            modifiersClassNames={{
              hasLessonPlan: "bg-green-200 mx-1 text-primary rounded-sm font-semibold",
              dayOff: "text-red-500 font-semibold",
              sunday: "text-red-500 font-semibold",
            }}
          />
        </div>

      </CardContent>
      <CardFooter className="mt-4">
        <p className="text-xs text-center text-muted-foreground">
          {lessonPlansThisMonth} rencana pembelajaran bulan ini
        </p>
      </CardFooter>
    </Card>
  )
}