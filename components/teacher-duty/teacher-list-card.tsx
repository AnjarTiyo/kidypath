import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconUserPlus, IconUser } from "@tabler/icons-react"
import type { TeacherData } from "@/lib/hooks/use-teacher-duty"

interface TeacherListCardProps {
  teacher: TeacherData
  isOnDuty: boolean
  onAssign: () => void
}

export function TeacherListCard({ teacher, isOnDuty, onAssign }: TeacherListCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <IconUser className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{teacher.name ?? "-"}</p>
            <p className="text-sm text-muted-foreground truncate">{teacher.email ?? "-"}</p>
          </div>
        </div>
        {isOnDuty ? (
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            Sudah Piket
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 gap-1"
            onClick={onAssign}
          >
            <IconUserPlus className="h-4 w-4" />
            Tambah Piket
          </Button>
        )}
      </div>
    </Card>
  )
}
