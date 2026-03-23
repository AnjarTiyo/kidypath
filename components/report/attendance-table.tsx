'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IconUsers } from '@tabler/icons-react'
import Link from 'next/link'

export interface AttendanceSummaryRow {
  studentId: string
  studentName: string | null
  present: number
  sick: number
  permission: number
}

interface AttendanceTableProps {
  rows: AttendanceSummaryRow[]
  dateRangeLabel: string
  studentReportBasePath: string
}

export function AttendanceTable({ rows, dateRangeLabel, studentReportBasePath }: AttendanceTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconUsers size={18} />
          Rekap Kehadiran — {dateRangeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="text-center">Hadir</TableHead>
                <TableHead className="text-center">Sakit</TableHead>
                <TableHead className="text-center">Izin</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada data kehadiran
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell className="font-medium">{row.studentName ?? '—'}</TableCell>
                  <TableCell className="text-center text-green-700 font-semibold">{row.present}</TableCell>
                  <TableCell className="text-center text-yellow-700 font-semibold">{row.sick}</TableCell>
                  <TableCell className="text-center text-gray-600 font-semibold">{row.permission}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {row.present + row.sick + row.permission}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`${studentReportBasePath}/${row.studentId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Detail →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
