import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconTrash, IconUserCheck } from "@tabler/icons-react"
import type { TeacherData } from "@/lib/hooks/use-teacher-duty"

interface DutyTeacherCardProps {
  teacher: TeacherData
  onRemove: () => void
}

export function DutyTeacherCard({ teacher, onRemove }: DutyTeacherCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <IconUserCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{teacher.name ?? "-"}</p>
            <p className="text-sm text-muted-foreground truncate">{teacher.email ?? "-"}</p>
            <Badge className="mt-1 text-xs bg-primary text-primary-foreground">Piket</Badge>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
