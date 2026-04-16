'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconNotes } from '@tabler/icons-react'

export interface AssessmentSummaryItem {
  studentId: string | null
  studentName: string | null
  date: string | null
  summary: string
  items: {
    scopeName: string | null
    activityContext: string | null
    score: string | null
    note: string | null
  }[]
}

interface AssessmentSummariesProps {
  summaries: AssessmentSummaryItem[]
}

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: 'Nilai Agama dan Moral',
  physical_motor: 'Fisik Motorik',
  cognitive: 'Kognitif',
  language: 'Bahasa',
  social_emotional: 'Sosial Emosional',
  art: 'Seni',
}

const SCORE_COLORS: Record<string, string> = {
  BB: 'bg-red-100 text-red-700 border-red-200',
  MB: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  BSH: 'bg-blue-100 text-blue-700 border-blue-200',
  BSB: 'bg-green-100 text-green-700 border-green-200',
}

const SCOPE_COLORS: Record<string, string> = {
  'Nilai Agama dan Moral': 'bg-purple-100 text-purple-800 border-purple-200',
  'Fisik Motorik': 'bg-green-100 text-green-800 border-green-200',
  'Kognitif': 'bg-blue-100 text-blue-800 border-blue-200',
  'Bahasa': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Sosial Emosional': 'bg-pink-100 text-pink-800 border-pink-200',
  'Seni': 'bg-orange-100 text-orange-800 border-orange-200',
}

function getScopeName(raw: string | null): string {
  if (!raw) return '—'
  return SCOPE_LABELS[raw] ?? raw
}

export function AssessmentSummaries({ summaries }: AssessmentSummariesProps) {
  const [selected, setSelected] = useState<AssessmentSummaryItem | null>(null)

  const columns: ColumnDef<AssessmentSummaryItem>[] = [
    {
      accessorKey: 'studentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('studentName') ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
      cell: ({ row }) => {
        const date = row.getValue('date') as string | null
        if (!date) return <span className="text-muted-foreground">—</span>
        return (
          <span className="text-sm">
            {new Date(date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )
      },
    },
    {
      accessorKey: 'summary',
      header: 'Ringkasan',
      cell: ({ row }) => (
        <p className="max-w-sm truncate text-sm text-muted-foreground">
          {row.getValue('summary')}
        </p>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setSelected(row.original)}
        >
          Lihat Detail
        </Button>
      ),
    },
  ]

  if (summaries.length === 0) return null

  return (
    <>
      <Card className="min-h-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconNotes size={18} />
            Ringkasan Pencapaian
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={summaries}
            manualPagination={true}
            pageIndex={0}
            pageSize={summaries.length}
            pageCount={1}
            totalCount={summaries.length}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.studentName ?? '—'}</DialogTitle>
            {selected?.date && (
              <p className="text-xs text-muted-foreground pt-0.5">
                {new Date(selected.date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Assessment items table */}
              {selected.items.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[180px] font-semibold text-xs">Lingkup Perkembangan</TableHead>
                        <TableHead className="font-semibold text-xs">Konteks Kegiatan</TableHead>
                        <TableHead className="w-[90px] font-semibold text-xs">Skor</TableHead>
                        <TableHead className="font-semibold text-xs">Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.items.map((item, idx) => {
                        const displayScope = getScopeName(item.scopeName)
                        return (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="align-top py-3">
                              <Badge
                                variant="outline"
                                className={`text-[11px] whitespace-normal text-left leading-tight ${SCOPE_COLORS[displayScope] ?? ''}`}
                              >
                                {displayScope}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top py-3 text-sm">
                              {item.activityContext ?? <span className="text-muted-foreground italic">—</span>}
                            </TableCell>
                            <TableCell className="align-top py-3">
                              {item.score ? (
                                <Badge variant="outline" className={`text-xs ${SCORE_COLORS[item.score] ?? ''}`}>
                                  {item.score}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="align-top py-3 text-sm text-muted-foreground">
                              {item.note ?? '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Summary */}
              {selected.summary && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ringkasan</p>
                    <p className="text-sm leading-relaxed">{selected.summary}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

