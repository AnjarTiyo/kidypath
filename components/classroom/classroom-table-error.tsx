import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react"

interface ClassroomTableErrorProps {
  message?: string
  onRetry?: () => void
}

export function ClassroomTableError({ 
  message = "Gagal memuat data kelas. Silakan coba lagi.",
  onRetry 
}: ClassroomTableErrorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium mb-2">Terjadi Kesalahan</p>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <IconRefresh className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
