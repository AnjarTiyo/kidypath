'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  delta?: number
  deltaLabel?: string
  colorVariant?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
  suffix?: string
}

const variantClasses: Record<string, string> = {
  default: 'text-foreground',
  green: 'text-emerald-600',
  red: 'text-red-500',
  yellow: 'text-amber-500',
  blue: 'text-blue-500',
}

const iconBg: Record<string, string> = {
  default: 'bg-muted',
  green: 'bg-emerald-50',
  red: 'bg-red-50',
  yellow: 'bg-amber-50',
  blue: 'bg-blue-50',
}

export function KpiCard({ label, value, icon: Icon, delta, deltaLabel, colorVariant = 'default', suffix }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn('p-2 rounded-sm shrink-0', iconBg[colorVariant])}>
          <Icon size={20} className={variantClasses[colorVariant]} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
          <p className={cn('text-2xl font-bold leading-tight', variantClasses[colorVariant])}>
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
          </p>
          {delta !== undefined && (
            <p className={cn('text-xs mt-0.5', delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%{deltaLabel ? ` ${deltaLabel}` : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
