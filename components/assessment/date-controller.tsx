"use client"

import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight, IconCalendar } from "@tabler/icons-react"
import { format, addDays, subDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface DateControllerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateController({ selectedDate, onDateChange }: DateControllerProps) {
  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
            aria-label="Previous day"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 flex-1 justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal min-w-[240px]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "EEEE, dd MMMM yyyy", { locale: localeId })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToday}
              >
                Hari Ini
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            aria-label="Next day"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
