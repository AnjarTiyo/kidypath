"use client"

import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { format, addDays, subDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { isDayOff } from "@/lib/helpers/school-days"

interface CompactDateNavigationProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
    dayOffDates?: string[]
}

export function CompactDateNavigation({ selectedDate, onDateChange, dayOffDates = [] }: CompactDateNavigationProps) {
    const handlePreviousDay = () => {
        onDateChange(subDays(selectedDate, 1))
    }

    const handleNextDay = () => {
        onDateChange(addDays(selectedDate, 1))
    }

    const handleSelectDate = (date: Date) => {
        onDateChange(date)
    }

    // Get 7 days centered around selected date (2 before, selected, 2 after)
    const getDays = () => {
        return Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 2))
    }

    const days = getDays()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
        <div className="flex items-center justify-between gap-2 p-1">
            <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousDay}
                className="h-8 w-8 shrink-0"
            >
                <IconChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
                {days.map((day, index) => {
                    const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                    const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
                    const isOff = isDayOff(day, dayOffDates)

                    return (
                        <button
                            key={index}
                            onClick={() => handleSelectDate(day)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[52px] px-2 py-2 rounded-md transition-all rounded-sm",
                                isOff && "text-red-500",
                                isSelected
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "hover:bg-accent",
                                isToday && !isSelected && "bg-secondary/50",
                                isOff && "opacity-60 cursor-not-allowed",
                            )}
                            disabled={isOff}
                        >
                            <span>
                                <span className="text-xs leading-tight">
                                    {format(day, "EEE", { locale: localeId })}
                                </span>
                            </span>
                            <span className={cn(
                                "text-lg font-semibold leading-none",
                                isOff ? "text-red-500" : isSelected ? "text-primary-foreground" : "text-foreground"
                            )}>
                                {format(day, "dd")}
                            </span>
                            <span className={cn(
                                "text-[10px] leading-tight mt-0.5",
                                isOff ? "text-red-500" : isSelected ? "text-primary-foreground" : "text-foreground"
                            )}>
                                {format(day, "MMM", { locale: localeId }).toUpperCase()}
                            </span>
                            <span className={cn(
                                "text-[9px] leading-tight",
                                isOff ? "text-red-500" : isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                                {format(day, "yyyy")}
                            </span>
                        </button>
                    )
                })}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
                className="h-8 w-8 shrink-0"
            >
                <IconChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
