"use client"

import { useState, useEffect } from "react"
import { id } from "date-fns/locale"
import { format } from "date-fns"
import { Calendar } from "../ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { IconCalendar, IconPlus } from "@tabler/icons-react"

interface LessonPlanCalendarProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
  onCreateClick: () => void
  lessonPlanDates: string[]
  dayOffDates?: string[] // Additional day-offs from Agenda entity (Sundays are always day-offs)
}

export default function LessonPlanCalendar({
  selectedDate,
  onDateSelect,
  onCreateClick,
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
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 border-b h-18">
        <div className="p-2 bg-muted flex items-center justify-center aspect-square rounded-md">
          <IconCalendar className="text-muted-foreground" size={20} />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">Kalender Rencana Pembelajaran</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Pilih tanggal untuk melihat atau membuat rencana pembelajaran
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          onMonthChange={setCurrentMonth}
          className="rounded-lg w-full"
          locale={id}
          modifiers={{
            hasLessonPlan: lessonPlanDates.map((date) => new Date(date)),
            dayOff: [
              ...dayOffDates.map((date) => new Date(date)),
              isSunday, // All Sundays are day-offs
            ],
          }}
          modifiersClassNames={{
            hasLessonPlan: "bg-green-200 text-primary rounded-md font-semibold",
            dayOff: "text-red-500 font-semibold",
          }}
        />
        <div className="space-y-2">
          <Button onClick={onCreateClick} className="w-full" size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Buat Rencana Pembelajaran
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {lessonPlansThisMonth} rencana pembelajaran bulan ini
          </p>
        </div>
      </CardContent>
    </Card>
  )
}