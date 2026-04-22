"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconCheck, IconEdit, IconLoader2, IconPlayerPlay } from "@tabler/icons-react"
import { moodOptions } from "./mood-selector"
import type { MoodType } from "./mood-selector"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string | null
  status: "present" | "sick" | "permission"
  mood: MoodType | null
  note: string | null
}

interface AttendanceSummaryProps {
  classroomName: string
  date: string
  type: "check_in" | "check_out"
  attendances: AttendanceRecord[]
  totalStudents?: number // New: to show completion status
  onEdit?: (studentId: string) => void
  onContinue?: () => void // New: callback to continue attendance process
  loading?: boolean
}

export function AttendanceSummary({
  classroomName,
  date,
  type,
  attendances,
  totalStudents,
  onEdit,
  onContinue,
  loading = false,
}: AttendanceSummaryProps) {
  const typeLabel = type === "check_in" ? "Check-In" : "Check-Out"
  
  const presentCount = attendances.filter(a => a.status === "present").length
  const sickCount = attendances.filter(a => a.status === "sick").length
  const permissionCount = attendances.filter(a => a.status === "permission").length
  const isComplete = totalStudents ? attendances.length >= totalStudents : true

  const getMoodEmoji = (mood: MoodType | null) => {
    if (!mood) return "-"
    const option = moodOptions.find(m => m.value === mood)
    return option ? option.emoji : "-"
  }

  const getMoodLabel = (mood: MoodType | null) => {
    if (!mood) return "-"
    const option = moodOptions.find(m => m.value === mood)
    return option ? option.label : "-"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="default" className="text-xs">Hadir</Badge>
      case "sick":
        return <Badge variant="destructive" className="text-xs">Sakit</Badge>
      case "permission":
        return <Badge variant="secondary" className="text-xs">Izin</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat ringkasan...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconCheck className="h-5 w-5 text-green-600" />
              {isComplete ? `${typeLabel} Selesai!` : `${typeLabel} Berlangsung`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isComplete 
                ? `Ringkasan kehadiran ${classroomName}`
                : `${attendances.length}/${totalStudents || attendances.length} siswa sudah dicatat`
              }
            </p>
          </div>
          {!isComplete && onContinue && (
            <Button
              variant="default"
              size="sm"
              onClick={onContinue}
              className="gap-2"
            >
              <IconPlayerPlay className="h-4 w-4" />
              Lanjutkan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-sm border">
            <div className="text-2xl font-bold text-green-700">{presentCount}</div>
            <div className="text-xs text-green-600">Hadir</div>
          </div>
          <div className="text-center p-3 rounded-sm border">
            <div className="text-2xl font-bold text-orange-700">{sickCount}</div>
            <div className="text-xs text-orange-600">Sakit</div>
          </div>
          <div className="text-center p-3 rounded-sm border">
            <div className="text-2xl font-bold text-blue-700">{permissionCount}</div>
            <div className="text-xs text-blue-600">Izin</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="border rounded-sm overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[40px]">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Mood</TableHead>
                  <TableHead className="w-[200px]">Catatan</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((attendance, index) => (
                  <TableRow key={attendance.id}>
                    <TableCell className="text-xs">{index + 1}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {attendance.studentName}
                    </TableCell>
                    <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                    <TableCell>
                      {attendance.status === "present" ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xl">{getMoodEmoji(attendance.mood)}</span>
                          <span className="text-xs text-muted-foreground">
                            {getMoodLabel(attendance.mood)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {attendance.note || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onEdit?.(attendance.studentId)}
                      >
                        <IconEdit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
