import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const SCORE_LABELS: Record<string, string> = {
  BB: 'Belum Berkembang',
  MB: 'Mulai Berkembang',
  BSH: 'Berkembang Sesuai Harapan',
  BSB: 'Berkembang Sangat Baik',
}

export const SCORE_COLORS: Record<string, string> = {
  BB: 'bg-red-100 text-red-700 border-red-200',
  MB: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  BSH: 'bg-blue-100 text-blue-700 border-blue-200',
  BSB: 'bg-green-100 text-green-700 border-green-200',
}

interface ScoreDistributionBadgeProps {
  score: string
  count?: number
  showLabel?: boolean
  className?: string
}

export function ScoreDistributionBadge({
  score,
  count,
  showLabel = false,
  className,
}: ScoreDistributionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-semibold', SCORE_COLORS[score] ?? '', className)}
    >
      {score}
      {count !== undefined && ` × ${count}`}
      {showLabel && ` – ${SCORE_LABELS[score] ?? score}`}
    </Badge>
  )
}
