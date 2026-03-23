'use client'

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { IconBrain } from '@tabler/icons-react'

export interface ScoreMap {
  BB: number
  MB: number
  BSH: number
  BSB: number
  total: number
}

const chartConfig = {
  skor: {
    label: 'Rata-rata Skor',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

interface ScoreRadarChartProps {
  scopeScores: Record<string, ScoreMap>
}

export function ScoreRadarChart({ scopeScores }: ScoreRadarChartProps) {
  const radarData = Object.entries(scopeScores).map(([scope, s]) => ({
    scope,
    skor:
      s.total > 0
        ? Math.round(((s.BB * 1 + s.MB * 2 + s.BSH * 3 + s.BSB * 4) / s.total) * 10) / 10
        : 0,
  }))

  return (
    <Card className='h-full'>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBrain size={18} />
          Distribusi Penilaian per Aspek Perkembangan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {radarData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada data penilaian</p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
            <RadarChart data={radarData}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ChartTooltip cursor={false} content={(props: any) => <ChartTooltipContent {...props} />} />
              <PolarAngleAxis dataKey="scope" tick={{ fontSize: 11 }} />
              <PolarGrid />
              <Radar
                dataKey="skor"
                fill="var(--color-skor)"
                fillOpacity={0.6}
                stroke="var(--color-skor)"
              />
            </RadarChart>
          </ChartContainer>
        )}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Skala 1–4: BB = 1, MB = 2, BSH = 3, BSB = 4
        </p>
      </CardContent>
    </Card>
  )
}
