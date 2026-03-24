'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { format, subDays } from 'date-fns'

interface DashboardFilters {
  startDate: string
  endDate: string
  classroomId: string
}

type FiltersUpdater = DashboardFilters | ((prev: DashboardFilters) => DashboardFilters)

interface DashboardFiltersContextValue {
  filters: DashboardFilters
  setFilters: (updater: FiltersUpdater) => void
}

const DashboardFiltersContext = createContext<DashboardFiltersContextValue | null>(null)

const DEFAULT_FILTERS: DashboardFilters = {
  startDate: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  classroomId: '',
}

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: DashboardFilters = {
    startDate: searchParams.get('startDate') || DEFAULT_FILTERS.startDate,
    endDate: searchParams.get('endDate') || DEFAULT_FILTERS.endDate,
    classroomId: searchParams.get('classroomId') || DEFAULT_FILTERS.classroomId,
  }

  const setFilters = useCallback(
    (updater: FiltersUpdater) => {
      const current = new URLSearchParams(searchParams.toString())
      const prev: DashboardFilters = {
        startDate: current.get('startDate') || DEFAULT_FILTERS.startDate,
        endDate: current.get('endDate') || DEFAULT_FILTERS.endDate,
        classroomId: current.get('classroomId') || DEFAULT_FILTERS.classroomId,
      }
      const next = typeof updater === 'function' ? updater(prev) : updater

      if (next.startDate) current.set('startDate', next.startDate)
      else current.delete('startDate')
      if (next.endDate) current.set('endDate', next.endDate)
      else current.delete('endDate')
      if (next.classroomId) current.set('classroomId', next.classroomId)
      else current.delete('classroomId')

      router.replace(`${pathname}?${current.toString()}`)
    },
    [searchParams, router, pathname]
  )

  return (
    <DashboardFiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </DashboardFiltersContext.Provider>
  )
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersContext)
  if (!ctx) throw new Error('useDashboardFilters must be used inside DashboardFiltersProvider')
  return ctx
}
