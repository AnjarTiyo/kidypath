'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  subMonths,
} from 'date-fns'

export type DateRangeGranularity = 'weekly' | 'monthly' | 'semester'

export interface DateRange {
  startDate: string
  endDate: string
  label: string
}

interface DateRangeSelectorProps {
  onRangeChange: (range: DateRange) => void
  defaultGranularity?: DateRangeGranularity
}

function getSemesterRange(offset: number): DateRange {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-based

  // Semester 1: Jan–Jun, Semester 2: Jul–Dec
  const inFirstHalf = month <= 6
  if (offset === 0) {
    const start = inFirstHalf ? `${year}-01-01` : `${year}-07-01`
    const end = inFirstHalf ? `${year}-06-30` : `${year}-12-31`
    const label = inFirstHalf
      ? `Semester 1 ${year}`
      : `Semester 2 ${year}`
    return { startDate: start, endDate: end, label }
  }
  // previous semester
  const prevStart = inFirstHalf ? `${year - 1}-07-01` : `${year}-01-01`
  const prevEnd = inFirstHalf ? `${year - 1}-12-31` : `${year}-06-30`
  const label = inFirstHalf
    ? `Semester 2 ${year - 1}`
    : `Semester 1 ${year}`
  return { startDate: prevStart, endDate: prevEnd, label }
}

export function DateRangeSelector({ onRangeChange, defaultGranularity = 'weekly' }: DateRangeSelectorProps) {
  const [granularity, setGranularity] = useState<DateRangeGranularity>(defaultGranularity)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const applyWeek = (offset: number) => {
    const base = new Date()
    base.setDate(base.getDate() + offset * 7)
    const start = startOfWeek(base, { weekStartsOn: 1 })
    const end = endOfWeek(base, { weekStartsOn: 1 })
    const range: DateRange = {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      label: `Minggu ${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`,
    }
    onRangeChange(range)
  }

  const applyMonth = (offset: number) => {
    const base = subMonths(new Date(), -offset)
    const start = startOfMonth(base)
    const end = endOfMonth(base)
    const range: DateRange = {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      label: format(start, 'MMMM yyyy'),
    }
    onRangeChange(range)
  }

  const applySemester = (offset: number) => {
    onRangeChange(getSemesterRange(offset))
  }

  const applyCustom = () => {
    if (!customStart || !customEnd) return
    onRangeChange({
      startDate: customStart,
      endDate: customEnd,
      label: `${customStart} – ${customEnd}`,
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Periode</Label>
        <Select
          value={granularity}
          onValueChange={(v) => setGranularity(v as DateRangeGranularity)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Mingguan</SelectItem>
            <SelectItem value="monthly">Bulanan</SelectItem>
            <SelectItem value="semester">Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {granularity === 'weekly' && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => applyWeek(-1)}>
            Minggu lalu
          </Button>
          <Button size="sm" onClick={() => applyWeek(0)}>
            Minggu ini
          </Button>
        </div>
      )}

      {granularity === 'monthly' && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => applyMonth(-1)}>
            Bulan lalu
          </Button>
          <Button size="sm" onClick={() => applyMonth(0)}>
            Bulan ini
          </Button>
        </div>
      )}

      {granularity === 'semester' && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => applySemester(1)}>
            Semester lalu
          </Button>
          <Button size="sm" onClick={() => applySemester(0)}>
            Semester ini
          </Button>
        </div>
      )}
    </div>
  )
}
