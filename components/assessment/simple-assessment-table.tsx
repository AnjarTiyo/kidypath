"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SimpleAssessmentItem {
  developmentScope: string
  learningGoal: string
  content: string
}

interface SimpleAssessmentTableProps {
  items: SimpleAssessmentItem[]
  className?: string
}

const scopeLabels: Record<string, string> = {
  religious_moral: "Nilai Agama dan Moral",
  physical_motor: "Fisik Motorik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosial Emosional",
  art: "Seni"
}

export function SimpleAssessmentTable({ items, className }: SimpleAssessmentTableProps) {
  return (
    <div className={`rounded-md border ${className || ""}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lingkup Perkembangan</TableHead>
            <TableHead>Tujuan Pembelajaran</TableHead>
            <TableHead>Konten</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                Tidak ada data
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {scopeLabels[item.developmentScope] || item.developmentScope}
                </TableCell>
                <TableCell>{item.learningGoal}</TableCell>
                <TableCell>{item.content}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
