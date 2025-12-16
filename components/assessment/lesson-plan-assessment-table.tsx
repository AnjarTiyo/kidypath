"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconSparkles } from "@tabler/icons-react"

interface LessonPlanItem {
  id: string
  developmentScope: string
  learningGoal: string
  activityContext: string
  generatedByAi?: boolean
}

interface LessonPlanAssessmentTableProps {
  items: LessonPlanItem[]
  title?: string
  description?: string
  showEmptyState?: boolean
}

const developmentScopeLabels: Record<string, string> = {
  religious_moral: "Nilai Agama dan Moral",
  physical_motor: "Fisik Motorik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosial Emosional",
  art: "Seni"
}

const developmentScopeColors: Record<string, string> = {
  religious_moral: "bg-purple-100 text-purple-800 border-purple-200",
  physical_motor: "bg-green-100 text-green-800 border-green-200",
  cognitive: "bg-blue-100 text-blue-800 border-blue-200",
  language: "bg-yellow-100 text-yellow-800 border-yellow-200",
  social_emotional: "bg-pink-100 text-pink-800 border-pink-200",
  art: "bg-orange-100 text-orange-800 border-orange-200"
}

export function LessonPlanAssessmentTable({ 
  items, 
  title = "Lingkup Perkembangan & Tujuan Pembelajaran",
  description,
  showEmptyState = true
}: LessonPlanAssessmentTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[220px] font-semibold">Lingkup Perkembangan</TableHead>
                <TableHead className="w-[320px] font-semibold">Tujuan Pembelajaran</TableHead>
                <TableHead className="font-semibold">Konteks Kegiatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Belum ada rencana pembelajaran untuk hari ini
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Silakan buat rencana pembelajaran terlebih dahulu
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="align-top py-4">
                      <div className="flex items-start gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${developmentScopeColors[item.developmentScope] || ""} whitespace-nowrap`}
                        >
                          {developmentScopeLabels[item.developmentScope] || item.developmentScope}
                        </Badge>
                        {item.generatedByAi && (
                          <IconSparkles className="h-4 w-4 text-blue-500 flex-shrink-0" title="Dibuat oleh AI" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <p className="text-sm leading-relaxed">
                        {item.learningGoal || <span className="text-muted-foreground italic">Belum diisi</span>}
                      </p>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <p className="text-sm leading-relaxed">
                        {item.activityContext || <span className="text-muted-foreground italic">Belum diisi</span>}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {items.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <p>Total {items.length} lingkup perkembangan</p>
            {items.some(item => item.generatedByAi) && (
              <div className="flex items-center gap-1">
                <IconSparkles className="h-3 w-3" />
                <span>Sebagian konten dibuat oleh AI</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
