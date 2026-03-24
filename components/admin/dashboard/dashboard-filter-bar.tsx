'use client'

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { useDashboardFilters } from './dashboard-filters-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconFilter, IconRefresh } from '@tabler/icons-react'

interface Classroom {
  id: string
  name: string
}

export function DashboardFilterBar() {
  const { filters, setFilters } = useDashboardFilters()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])

  useEffect(() => {
    fetch('/api/classrooms?pageSize=50')
      .then((r) => r.json())
      .then((data) => setClassrooms(data.data || []))
      .catch(() => {})
  }, [])

  function handleReset() {
    setFilters({
      startDate: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      classroomId: '',
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-primary text-primary-foreground rounded-xl w-full border">
      <IconFilter size={16} className="text-primary-foreground/90 shrink-0" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary-foreground/90 whitespace-nowrap">Dari</span>
        <Input
          type="date"
          className="h-8 w-36 text-sm"
          value={filters.startDate}
          onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary-foreground/90 whitespace-nowrap">Sampai</span>
        <Input
          type="date"
          className="h-8 w-36 text-sm"
          value={filters.endDate}
          onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
        />
      </div>
      <Select
        value={filters.classroomId || 'all'}
        onValueChange={(v) => setFilters((f) => ({ ...f, classroomId: v === 'all' ? '' : v }))}
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue placeholder="Semua Kelas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kelas</SelectItem>
          {classrooms.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" className="h-8 gap-1 text-primary" onClick={handleReset}>
        <IconRefresh size={14} />
        Reset
      </Button>
    </div>
  )
}
