'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { IconHeartbeat } from '@tabler/icons-react'

export interface MoodTimeSeriesItem {
  date: string
  checkIn: string | null
  checkOut: string | null
}

const MOOD_TO_NUM: Record<string, number> = {
  bahagia: 5,
  sedih: 4,
  marah: 3,
  takut: 2,
  jijik: 1,
}

const MOOD_NUM_LABELS: Record<number, string> = {
  5: 'Bahagia',
  4: 'Sedih',
  3: 'Marah',
  2: 'Takut',
  1: 'Jijik',
}

const chartConfig = {
  checkIn: {
    label: 'Check-in',
    color: 'var(--chart-2)',
  },
  checkOut: {
    label: 'Check-out',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

interface MoodLineChartProps {
  moodTimeSeries: MoodTimeSeriesItem[]
}

export function MoodLineChart({ moodTimeSeries }: MoodLineChartProps) {
  const chartData = moodTimeSeries.map((row) => ({
    date: new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    checkIn: row.checkIn ? (MOOD_TO_NUM[row.checkIn] ?? null) : null,
    checkOut: row.checkOut ? (MOOD_TO_NUM[row.checkOut] ?? null) : null,
  }))

  if (chartData.length === 0) return null

  return (
    <Card className='h-full'>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconHeartbeat size={18} />
          Distribusi Mood Kelas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[270px] aspect-auto w-full">
          <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(v: number) => MOOD_NUM_LABELS[v] ?? ''}
              tick={{ fontSize: 11 }}
              width={68}
            />
            { }
            <ChartTooltip
              content={(props: TooltipContentProps<number, string>) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { content: _content, ...rest } = props
                return (
                  <ChartTooltipContent
                    {...rest}
                    formatter={(value) => {
                      const num = typeof value === 'number' ? value : undefined
                      return num !== undefined ? (MOOD_NUM_LABELS[num] ?? String(num)) : String(value)
                    }}
                  />
                )
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="checkIn"
              stroke="var(--color-checkIn)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-checkIn)' }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="checkOut"
              stroke="var(--color-checkOut)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-checkOut)' }}
              connectNulls
              strokeDasharray="5 3"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
