import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconCalendar } from '@tabler/icons-react'
import { MOOD_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/types/weekly-report-detail'
import type { AttendanceDay } from '@/lib/types/weekly-report-detail'

interface WeeklyReportAttendanceProps {
  attendanceByDate: AttendanceDay[]
}

export function WeeklyReportAttendance({ attendanceByDate }: WeeklyReportAttendanceProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconCalendar size={18} />
          Rekap Kehadiran
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {attendanceByDate.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada data kehadiran pada periode ini
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-4 font-medium">Tanggal</th>
                  <th className="text-left py-2 pr-4 font-medium">Status</th>
                  <th className="text-left py-2 pr-4 font-medium">Mood Check-in</th>
                  <th className="text-left py-2 font-medium">Mood Check-out</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendanceByDate.map((day) => (
                  <tr key={day.date}>
                    <td className="py-2 pr-4 tabular-nums">
                      {new Date(day.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-2 pr-4">
                      {day.checkIn?.status ? (
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[day.checkIn.status] ?? ''}`}
                        >
                          {STATUS_LABELS[day.checkIn.status] ?? day.checkIn.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-sm">
                      {day.checkIn?.mood ? (
                        MOOD_LABELS[day.checkIn.mood] ?? day.checkIn.mood
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 text-sm">
                      {day.checkOut?.mood ? (
                        MOOD_LABELS[day.checkOut.mood] ?? day.checkOut.mood
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
