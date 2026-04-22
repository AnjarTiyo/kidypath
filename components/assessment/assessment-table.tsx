"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AssessmentItem {
  id: string
  developmentScope: string
  learningGoal: string
  activityContext: string
}

interface AssessmentTableProps {
  items: AssessmentItem[]
  title?: string
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

export function AssessmentTable({ items, title = "Rencana Penilaian" }: AssessmentTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Lingkup Perkembangan</TableHead>
                <TableHead className="w-[300px]">Tujuan Pembelajaran</TableHead>
                <TableHead>Konteks Kegiatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Belum ada data penilaian untuk hari ini
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={developmentScopeColors[item.developmentScope] || ""}
                      >
                        {developmentScopeLabels[item.developmentScope] || item.developmentScope}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.learningGoal || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.activityContext || "-"}</p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
