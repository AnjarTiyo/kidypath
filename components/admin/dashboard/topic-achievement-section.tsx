'use client'

import { Fragment, startTransition, useEffect, useState } from 'react'
import { useDashboardFilters } from './dashboard-filters-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import {
  IconTarget,
  IconHierarchy,
  IconTrendingUp,
  IconTrendingDown,
  IconBulb,
  IconCircleCheck,
  IconCircleX,
  IconAlertTriangle,
  IconDatabaseOff,
  IconFileOff,
  IconInfoCircle,
  IconCalendarWeek,
  IconLoader2,
} from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicRef { id: string; title: string }

interface TopicContext {
  weekly: TopicRef | null
  monthly: TopicRef | null
  semester: TopicRef | null
}

interface Distribution { BB: number; MB: number; BSH: number; BSB: number }

interface ScopeData {
  scope: string
  label: string
  totalScore: number
  totalItems: number
  maxTarget: number
  achievement: number
  avgScore: number
  distribution: Distribution
}

interface ApiResponse {
  topic: TopicContext
  scopes: ScopeData[]
  sampleSize: number
}

interface ChartEntry {
  label: string
  achievement: number
  scope: string
  totalScore: number
  totalItems: number
  avgScore: number
}

interface AllTopicScopeData {
  scope: string
  label: string
  totalItems: number
  totalScore: number
  achievement: number
}

interface AllTopicRow {
  weeklyTopicId: string
  weeklyTitle: string
  weekNumber: number | null
  monthlyTopicId: string
  monthlyTitle: string
  monthNumber: number | null
  semesterTopicId: string
  semesterTitle: string
  startDate: string
  endDate: string
  sampleSize: number
  overallAchievement: number | null
  scopes: AllTopicScopeData[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const chartConfig = {
  achievement: { label: 'Capaian (%)' },
} satisfies ChartConfig

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AchievementStatus = 'danger' | 'warning' | 'success' | 'exceed'

function getStatus(achievement: number): AchievementStatus {
  if (achievement > 100) return 'exceed'
  if (achievement >= 90) return 'success'
  if (achievement >= 70) return 'warning'
  return 'danger'
}

function getBarColor(status: AchievementStatus): string {
  switch (status) {
    case 'danger':  return '#ef4444'
    case 'warning': return '#f59e0b'
    case 'success': return '#10b981'
    case 'exceed':  return '#6366f1'
  }
}

function getScopeInsight(s: ScopeData): string {
  if (s.achievement > 100) {
    return `Aspek ${s.label} melampaui target BSH (${s.achievement.toFixed(1)}%). Pertahankan kualitas pembelajaran dan pertimbangkan pengayaan aktivitas yang lebih menantang.`
  }
  if (s.achievement >= 90) {
    const bshPct = s.totalItems > 0 ? ((s.distribution.BSH + s.distribution.BSB) / s.totalItems * 100).toFixed(0) : '0'
    return `Aspek ${s.label} sudah mencapai target BSH (${s.achievement.toFixed(1)}%). Sebanyak ${bshPct}% hasil penilaian berada di level BSH ke atas.`
  }
  if (s.achievement >= 70) {
    return `Aspek ${s.label} mendekati target BSH (${s.achievement.toFixed(1)}%). Tingkatkan stimulasi dan variasikan strategi pembelajaran untuk mendorong lebih banyak anak mencapai level BSH.`
  }
  return `Aspek ${s.label} memerlukan perhatian khusus (${s.achievement.toFixed(1)}%). Evaluasi pendekatan dan metode pembelajaran, serta perbanyak frekuensi aktivitas pada aspek ini.`
}

function getOverallInsight(scopes: ScopeData[]): string {
  if (scopes.length === 0) return ''
  const weakest = [...scopes].sort((a, b) => a.achievement - b.achievement)[0]
  const avg = scopes.reduce((a, s) => a + s.achievement, 0) / scopes.length
  if (weakest.achievement < 70) {
    return `Aspek ${weakest.label} belum mencapai 70% target BSH. Rekomendasikan guru untuk memperbanyak aktivitas stimulasi pada aspek ini di sisa periode pembelajaran.`
  }
  if (avg >= 90) {
    return `Seluruh aspek perkembangan rata-rata mencapai ${avg.toFixed(1)}%, melampaui ambang batas target BSH. Pembelajaran berjalan dengan sangat baik pada periode ini.`
  }
  return `Rata-rata capaian ${avg.toFixed(1)}%. Fokuskan pada aspek ${weakest.label} untuk pemerataan ketercapaian perkembangan seluruh anak.`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ achievement, size = 15 }: { achievement: number; size?: number }) {
  if (achievement > 100) return <IconTrendingUp size={size} className="text-indigo-600" />
  if (achievement >= 90)  return <IconCircleCheck size={size} className="text-emerald-600" />
  if (achievement >= 70)  return <IconAlertTriangle size={size} className="text-amber-500" />
  return <IconCircleX size={size} className="text-red-500" />
}

function AchievementBadge({ achievement }: { achievement: number }) {
  const status = getStatus(achievement)
  const classes =
    status === 'exceed'  ? 'bg-indigo-100 text-indigo-700' :
    status === 'success' ? 'bg-emerald-100 text-emerald-700' :
    status === 'warning' ? 'bg-amber-100 text-amber-700' :
                           'bg-red-100 text-red-700'
  return <Badge className={`${classes} text-xs tabular-nums`}>{achievement.toFixed(1)}%</Badge>
}

function TopicContextCard({ topic }: { topic: TopicContext }) {
  const hasAnyTopic = topic.semester || topic.monthly || topic.weekly
  if (!hasAnyTopic) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center gap-3 text-sm text-muted-foreground">
          <IconFileOff size={16} className="shrink-0" />
          <span>Topik kurikulum untuk periode ini belum dikonfigurasi. Tambahkan topik semester, bulan, dan mingguan di menu Kurikulum.</span>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <IconHierarchy size={16} className="text-muted-foreground shrink-0" />
          {topic.semester && (
            <>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Semester</span>
                <span className="text-sm font-semibold truncate">{topic.semester.title}</span>
              </div>
              {(topic.monthly || topic.weekly) && (
                <span className="text-muted-foreground/40 text-xl select-none">›</span>
              )}
            </>
          )}
          {topic.monthly && (
            <>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Bulan</span>
                <span className="text-sm font-semibold truncate">{topic.monthly.title}</span>
              </div>
              {topic.weekly && (
                <span className="text-muted-foreground/40 text-xl select-none">›</span>
              )}
            </>
          )}
          {topic.weekly && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Minggu Ini</span>
              <span className="text-sm font-semibold truncate">{topic.weekly.title}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AchievementBarChart({
  scopes,
  onBarClick,
}: {
  scopes: ScopeData[]
  onBarClick: (s: ScopeData) => void
}) {
  const maxDomain = Math.max(120, Math.ceil(Math.max(...scopes.map((s) => s.achievement)) / 10) * 10 + 10)
  const chartData: ChartEntry[] = scopes.map((s) => ({
    label: s.label,
    achievement: s.achievement,
    scope: s.scope,
    totalScore: s.totalScore,
    totalItems: s.totalItems,
    avgScore: s.avgScore,
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(220, scopes.length * 52) }}
    >
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          domain={[0, maxDomain]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={118}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <ReferenceLine
          x={100}
          stroke="#94a3b8"
          strokeDasharray="4 2"
          strokeWidth={1.5}
          label={{ value: 'BSH', position: 'insideTopRight', fill: '#94a3b8', fontSize: 10 }}
        />
        <ChartTooltip
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <div className="rounded-sm border bg-background px-3 py-2.5 shadow-md text-sm space-y-1 min-w-[180px]">
                <div className="flex items-center gap-1.5 font-medium">
                  <StatusIcon achievement={payload[0].payload.achievement} />
                  {payload[0].payload.label}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 pt-0.5 border-t">
                  <p>Capaian: <strong className="text-foreground">{(payload[0].payload.achievement as number).toFixed(1)}%</strong></p>
                  <p>Total Skor: <strong className="text-foreground">{payload[0].payload.totalScore}</strong></p>
                  <p>Item Penilaian: <strong className="text-foreground">{payload[0].payload.totalItems}</strong></p>
                  <p>Rata-rata Skor: <strong className="text-foreground">{(payload[0].payload.avgScore as number).toFixed(2)}</strong></p>
                </div>
              </div>
            ) : null
          }
        />
        <Bar
          dataKey="achievement"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(data) => {
            const entry = data as unknown as ChartEntry
            const found = scopes.find((s) => s.scope === entry.scope)
            if (found) onBarClick(found)
          }}
          label={{
            position: 'right',
            formatter: (v: unknown) => typeof v === 'number' ? `${v.toFixed(1)}%` : '',
            fontSize: 11,
            fill: '#6b7280',
          }}
        >
          {chartData.map((entry) => (
            <Cell key={entry.scope} fill={getBarColor(getStatus(entry.achievement))} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function InsightPanel({ scopes }: { scopes: ScopeData[] }) {
  if (scopes.length === 0) return null
  const sorted = [...scopes].sort((a, b) => b.achievement - a.achievement)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]
  const insightText = getOverallInsight(scopes)

  return (
    <Card className="min-h-full">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold">Insight Pembelajaran</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-start gap-2.5">
          <IconTrendingUp size={15} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Aspek Terkuat</p>
            <p className="text-sm font-semibold mt-0.5">{strongest.label}</p>
            <AchievementBadge achievement={strongest.achievement} />
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <IconTrendingDown size={15} className="text-red-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Perlu Perhatian</p>
            {weakest.achievement < 75 ? (
              <>
                <p className="text-sm font-semibold mt-0.5">{weakest.label}</p>
                <AchievementBadge achievement={weakest.achievement} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">—</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2.5 border-t pt-3">
          <IconBulb size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{insightText}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailTable({
  scopes,
  onRowClick,
}: {
  scopes: ScopeData[]
  onRowClick: (s: ScopeData) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-3 font-medium">Aspek</th>
            <th className="text-center py-2 px-2 font-medium">Item</th>
            <th className="text-center py-2 px-2 font-medium">Total Skor</th>
            <th className="text-center py-2 px-2 font-medium">Rata-rata</th>
            <th className="text-center py-2 px-2 font-medium">Capaian (BSH)</th>
            <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">Distribusi (BB/MB/BSH/BSB)</th>
            <th className="text-center py-2 px-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {scopes.map((s) => {
            const status = getStatus(s.achievement)
            const achievementColor =
              status === 'exceed'  ? 'text-indigo-600' :
              status === 'success' ? 'text-emerald-600' :
              status === 'warning' ? 'text-amber-600' :
                                     'text-red-600'
            return (
              <tr
                key={s.scope}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => onRowClick(s)}
              >
                <td className="py-2.5 pr-3 font-medium">{s.label}</td>
                <td className="text-center py-2.5 px-2 tabular-nums">{s.totalItems}</td>
                <td className="text-center py-2.5 px-2 tabular-nums">{s.totalScore}</td>
                <td className="text-center py-2.5 px-2 tabular-nums">{s.avgScore.toFixed(2)}</td>
                <td className="text-center py-2.5 px-2">
                  <span className={`font-semibold tabular-nums ${achievementColor}`}>
                    {s.achievement.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-2.5 px-2 hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                    <span className="text-red-500">{s.distribution.BB}</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-amber-500">{s.distribution.MB}</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-emerald-500">{s.distribution.BSH}</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-indigo-500">{s.distribution.BSB}</span>
                  </div>
                </td>
                <td className="text-center py-2.5 px-2">
                  <div className="flex justify-center">
                    <StatusIcon achievement={s.achievement} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── All Topics Table ──────────────────────────────────────────────────────────

const MONTH_NAMES: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
}

function AllTopicsTable({
  rows,
  loading,
  currentWeeklyTopicId,
  onRowClick,
}: {
  rows: AllTopicRow[]
  loading: boolean
  currentWeeklyTopicId?: string | null
  onRowClick: (row: AllTopicRow) => void
}) {
  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 size={16} className="animate-spin" />
        Memuat semua topik...
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
        <IconDatabaseOff size={28} className="opacity-40" />
        <span className="text-sm">Belum ada topik mingguan yang dikonfigurasi untuk tahun ajaran ini</span>
      </div>
    )
  }

  const semesterOrder: string[] = []
  const grouped: Record<string, { monthOrder: string[]; months: Record<string, AllTopicRow[]> }> = {}

  for (const row of rows) {
    const semKey = row.semesterTopicId
    const monKey = row.monthlyTopicId
    if (!grouped[semKey]) {
      grouped[semKey] = { monthOrder: [], months: {} }
      semesterOrder.push(semKey)
    }
    if (!grouped[semKey].months[monKey]) {
      grouped[semKey].months[monKey] = []
      grouped[semKey].monthOrder.push(monKey)
    }
    grouped[semKey].months[monKey].push(row)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs">
            <th className="text-left py-2 pr-3 font-medium w-1/2">Topik Mingguan</th>
            <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">Periode</th>
            <th className="text-center py-2 px-2 font-medium">Item</th>
            <th className="text-center py-2 px-2 font-medium">Capaian</th>
            <th className="text-center py-2 px-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {semesterOrder.map((semId) => {
            const { monthOrder, months } = grouped[semId]
            const semTitle = rows.find((r) => r.semesterTopicId === semId)?.semesterTitle ?? semId
            return (
              <Fragment key={`sem-${semId}`}>
                <tr>
                  <td colSpan={5} className="py-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30">
                    {semTitle}
                  </td>
                </tr>
                {monthOrder.map((monId) => {
                  const weekRows = months[monId]
                  const firstRow = weekRows[0]
                  const monLabel = firstRow.monthNumber
                    ? `${MONTH_NAMES[firstRow.monthNumber] ?? firstRow.monthNumber} — ${firstRow.monthlyTitle}`
                    : firstRow.monthlyTitle
                  return (
                    <Fragment key={`mon-${monId}`}>
                      <tr>
                        <td colSpan={5} className="py-1 pl-4 text-[11px] text-muted-foreground italic bg-muted/10">
                          {monLabel}
                        </td>
                      </tr>
                      {weekRows.map((row) => {
                        const isCurrent = row.weeklyTopicId === currentWeeklyTopicId

                        const achievementColor =
                          row.overallAchievement == null ? 'text-muted-foreground' :
                          row.overallAchievement > 100  ? 'text-indigo-600' :
                          row.overallAchievement >= 90  ? 'text-emerald-600' :
                          row.overallAchievement >= 70  ? 'text-amber-600' :
                                                           'text-red-600'
                        return (
                          <tr
                            key={row.weeklyTopicId}
                            className={`border-b last:border-0 cursor-pointer transition-colors ${
                              isCurrent ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-muted/30'
                            }`}
                            onClick={() => onRowClick(row)}
                          >
                            <td className="py-2.5 pl-8 pr-3">
                              <div className="flex items-center gap-1.5">
                                {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                                <div>
                                  <span className={`font-medium ${isCurrent ? 'text-blue-700' : ''}`}>
                                    Minggu {row.weekNumber ?? '?'}
                                  </span>
                                  {isCurrent && (
                                    <Badge className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 border-0">Aktif</Badge>
                                  )}
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
                                    {row.weeklyTitle}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-2.5 px-2 text-xs text-muted-foreground hidden sm:table-cell tabular-nums">
                              {row.startDate} – {row.endDate}
                            </td>
                            <td className="text-center py-2.5 px-2 tabular-nums text-xs">
                              {row.sampleSize > 0 ? row.sampleSize : <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className="text-center py-2.5 px-2">
                              {row.overallAchievement != null ? (
                                <span className={`font-semibold tabular-nums text-sm ${achievementColor}`}>
                                  {row.overallAchievement.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">Belum ada data</span>
                              )}
                            </td>
                            <td className="text-center py-2.5 px-2">
                              {row.overallAchievement != null ? (
                                <div className="flex justify-center"><StatusIcon achievement={row.overallAchievement} /></div>
                              ) : (
                                <span className="text-muted-foreground/30 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── All-topic drill-down dialog ──────────────────────────────────────────────

function AllTopicDetailDialog({ row, onClose }: { row: AllTopicRow; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCalendarWeek size={17} />
            Minggu {row.weekNumber ?? '?'} — {row.weeklyTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-sm px-3 py-2 space-y-0.5">
            <p><span className="font-medium">Topik Bulan:</span> {row.monthlyTitle}</p>
            <p><span className="font-medium">Semester:</span> {row.semesterTitle}</p>
            <p><span className="font-medium">Periode:</span> {row.startDate} — {row.endDate}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-sm p-3">
              <p className="text-xs text-muted-foreground">Total Item Penilaian</p>
              <p className="text-2xl font-bold tabular-nums">{row.sampleSize}</p>
            </div>
            <div className="bg-muted/40 rounded-sm p-3">
              <p className="text-xs text-muted-foreground">Capaian Rata-rata</p>
              {row.overallAchievement != null ? (
                <p className={`text-2xl font-bold tabular-nums ${
                  row.overallAchievement > 100 ? 'text-indigo-600' :
                  row.overallAchievement >= 90 ? 'text-emerald-600' :
                  row.overallAchievement >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>{row.overallAchievement.toFixed(1)}%</p>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground/40">—</p>
              )}
            </div>
          </div>
          {row.scopes.length > 0 ? (
            <div>
              <p className="text-sm font-semibold mb-2">Capaian per Aspek</p>
              <div className="space-y-2.5">
                {row.scopes.map((s) => {
                  const barColor =
                    s.achievement > 100 ? 'bg-indigo-500' :
                    s.achievement >= 90 ? 'bg-emerald-500' :
                    s.achievement >= 70 ? 'bg-amber-400' :
                    s.totalItems > 0    ? 'bg-red-400' : 'bg-muted-foreground/20'
                  return (
                    <div key={s.scope}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          {s.totalItems > 0 && <StatusIcon achievement={s.achievement} size={13} />}
                          <span className="text-xs font-medium">{s.label}</span>
                        </div>
                        <span className="text-xs tabular-nums font-semibold text-muted-foreground">
                          {s.totalItems > 0 ? `${s.achievement.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(100, s.achievement)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center gap-1.5 text-muted-foreground">
              <IconDatabaseOff size={22} className="opacity-40" />
              <span className="text-xs">Tidak ada data penilaian pada periode ini</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function TopicAchievementSection() {
  const { filters } = useDashboardFilters()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScope, setSelectedScope] = useState<ScopeData | null>(null)
  const [allTopics, setAllTopics] = useState<AllTopicRow[]>([])
  const [allTopicsLoading, setAllTopicsLoading] = useState(true)
  const [selectedTopicRow, setSelectedTopicRow] = useState<AllTopicRow | null>(null)

  useEffect(() => {
    startTransition(() => setLoading(true))
    const params = new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate })
    if (filters.classroomId) params.set('classroomId', filters.classroomId)
    fetch(`/api/admin/dashboard/topic-achievement?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters.startDate, filters.endDate, filters.classroomId])

  useEffect(() => {
    startTransition(() => setAllTopicsLoading(true))
    const params = new URLSearchParams({ endDate: filters.endDate })
    if (filters.classroomId) params.set('classroomId', filters.classroomId)
    fetch(`/api/admin/dashboard/topic-achievement/all-topics?${params}`)
      .then((r) => r.json())
      .then((d) => { setAllTopics(d.rows || []); setAllTopicsLoading(false) })
      .catch(() => setAllTopicsLoading(false))
  }, [filters.endDate, filters.classroomId])

  return (
    <>
      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconTarget size={18} />
              Analisa Ketercapaian Topik
            </CardTitle>
            <div className="group relative">
              <IconInfoCircle size={16} className="text-muted-foreground cursor-help" />
              <div className="absolute right-0 top-6 w-64 bg-popover border rounded-sm px-3 py-2 text-xs text-muted-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                Capaian dihitung dengan formula: (Total Skor / (Jumlah Item x 3)) x 100%.
                Target BSH = nilai 3. Capaian 100% berarti seluruh anak mencapai level BSH.
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluasi ketercapaian target perkembangan berdasarkan topik aktif
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
              Memuat data...
            </div>
          ) : !data ? (
            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
              <IconDatabaseOff size={32} className="opacity-40" />
              <span className="text-sm">Gagal memuat data</span>
            </div>
          ) : data.sampleSize === 0 ? (
            <div className="space-y-4">
              <TopicContextCard topic={data.topic} />
              <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                <IconDatabaseOff size={32} className="opacity-40" />
                <span className="text-sm font-medium">Belum ada data penilaian</span>
                <span className="text-xs">Tidak ada item penilaian pada periode yang dipilih</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Topic context breadcrumb */}
              <TopicContextCard topic={data.topic} />

              {/* Low sample warning */}
              {data.sampleSize < 10 && (
                <div className="flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                  <IconAlertTriangle size={14} className="shrink-0" />
                  <span>Data terbatas ({data.sampleSize} item penilaian). Hasil analisa mungkin belum representatif.</span>
                </div>
              )}

              {/* Chart + Insight 8/4 grid */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-8">
                  <Card>
                    <CardHeader className="border-b pb-3">
                      <CardTitle className="text-sm font-semibold">Capaian per Aspek Perkembangan</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <AchievementBarChart scopes={data.scopes} onBarClick={setSelectedScope} />
                    </CardContent>
                  </Card>
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <InsightPanel scopes={data.scopes} />
                </div>
              </div>

              {/* Detail table */}
              <Card>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Tabel Detail Ketercapaian</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Capaian dihitung berdasarkan total skor terhadap jumlah item penilaian (dengan asumsi skor optimal per item adalah 3 - BSH). Klik bar pada grafik untuk melihat rincian distribusi nilai dan insight per aspek.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <DetailTable scopes={data.scopes} onRowClick={setSelectedScope} />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Topics Table */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <IconCalendarWeek size={15} />
            Ketercapaian Semua Topik Mingguan
          </CardTitle>
          <CardDescription className="text-xs">
            Seluruh topik mingguan dalam tahun ajaran beserta status ketercapaiannya. Klik baris untuk melihat rincian per aspek perkembangan. Baris biru adalah topik aktif berdasarkan tanggal filter.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <AllTopicsTable
            rows={allTopics}
            loading={allTopicsLoading}
            currentWeeklyTopicId={data?.topic?.weekly?.id ?? null}
            onRowClick={setSelectedTopicRow}
          />
        </CardContent>
      </Card>

      {/* Drill-down dialog — active topic scope */}
      {selectedScope && (
        <Dialog open={!!selectedScope} onOpenChange={() => setSelectedScope(null)}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StatusIcon achievement={selectedScope.achievement} size={18} />
                {selectedScope.label}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground">Total Item</p>
                  <p className="text-2xl font-bold tabular-nums">{selectedScope.totalItems}</p>
                </div>
                <div className="bg-muted/40 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground">Total Skor</p>
                  <p className="text-2xl font-bold tabular-nums">{selectedScope.totalScore}</p>
                </div>
                <div className="bg-muted/40 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground">Rata-rata Skor</p>
                  <p className="text-2xl font-bold tabular-nums">{selectedScope.avgScore.toFixed(2)}</p>
                </div>
                <div className="bg-muted/40 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground">Capaian BSH</p>
                  <p className={`text-2xl font-bold tabular-nums ${
                    getStatus(selectedScope.achievement) === 'exceed'  ? 'text-indigo-600' :
                    getStatus(selectedScope.achievement) === 'success' ? 'text-emerald-600' :
                    getStatus(selectedScope.achievement) === 'warning' ? 'text-amber-600' :
                                                                          'text-red-600'
                  }`}>
                    {selectedScope.achievement.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Distribution */}
              <div>
                <p className="text-sm font-semibold mb-2.5">Distribusi Nilai</p>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'BB',  label: 'BB',  count: selectedScope.distribution.BB,  cls: 'bg-red-50 text-red-700' },
                      { key: 'MB',  label: 'MB',  count: selectedScope.distribution.MB,  cls: 'bg-amber-50 text-amber-700' },
                      { key: 'BSH', label: 'BSH', count: selectedScope.distribution.BSH, cls: 'bg-emerald-50 text-emerald-700' },
                      { key: 'BSB', label: 'BSB', count: selectedScope.distribution.BSB, cls: 'bg-indigo-50 text-indigo-700' },
                    ] as const
                  ).map(({ key, label, count, cls }) => (
                    <div key={key} className={`rounded-sm p-3 text-center ${cls}`}>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-2xl font-bold tabular-nums">{count}</p>
                      <p className="text-[10px] opacity-70 tabular-nums">
                        {selectedScope.totalItems > 0
                          ? ((count / selectedScope.totalItems) * 100).toFixed(0)
                          : 0}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope insight */}
              <div className="bg-muted/30 rounded-sm p-3 flex items-start gap-2">
                <IconBulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {getScopeInsight(selectedScope)}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Drill-down dialog — all-topics row */}
      {selectedTopicRow && (
        <AllTopicDetailDialog
          row={selectedTopicRow}
          onClose={() => setSelectedTopicRow(null)}
        />
      )}
    </>
  )
}
