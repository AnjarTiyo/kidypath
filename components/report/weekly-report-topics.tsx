import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconBook } from '@tabler/icons-react'
import { MONTH_NAMES } from '@/lib/types/weekly-report-detail'
import type { TopicsPayload } from '@/lib/types/weekly-report-detail'

interface WeeklyReportTopicsProps {
  topics: TopicsPayload | null
}

export function WeeklyReportTopics({ topics }: WeeklyReportTopicsProps) {
  const monthName = topics?.monthly?.monthNumber
    ? MONTH_NAMES[(topics.monthly.monthNumber - 1) % 12]
    : null

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBook size={18} />
          Topik Pembelajaran
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!topics ? (
          <p className="text-sm text-muted-foreground italic">
            Topik belum dikonfigurasi untuk periode ini
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {topics.semester && (
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground w-32 font-medium">Semester</td>
                  <td className="py-2">
                    {topics.semester.title}
                    {topics.semester.semesterNumber && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Semester {topics.semester.semesterNumber}, TA {topics.semester.academicYear})
                      </span>
                    )}
                  </td>
                </tr>
              )}
              {topics.monthly && (
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground font-medium">Bulanan</td>
                  <td className="py-2">
                    {topics.monthly.title}
                    {monthName && (
                      <span className="ml-2 text-xs text-muted-foreground">({monthName})</span>
                    )}
                  </td>
                </tr>
              )}
              {topics.weekly && (
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground font-medium">Mingguan</td>
                  <td className="py-2">
                    {topics.weekly.title}
                    {topics.weekly.weekNumber && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Minggu {topics.weekly.weekNumber})
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
