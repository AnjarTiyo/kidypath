import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WeeklyReportCardProps {
  weekStart: string | null
  weekEnd: string | null
  summaryText: string | null
  studentName?: string
  createdAt?: Date | null
}

export function WeeklyReportCard({
  weekStart,
  weekEnd,
  summaryText,
  studentName,
  createdAt,
}: WeeklyReportCardProps) {
  const weekLabel =
    weekStart && weekEnd ? `${weekStart} – ${weekEnd}` : '—'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            📋 Laporan Minggu {weekLabel}
            {studentName && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {studentName}
              </span>
            )}
          </span>
          <Badge variant="secondary" className="text-xs">
            {createdAt ? new Date(createdAt).toLocaleDateString('id-ID') : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summaryText ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {summaryText}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Laporan belum tersedia.</p>
        )}
      </CardContent>
    </Card>
  )
}
