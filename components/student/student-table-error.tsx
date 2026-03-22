import { Button } from "@/components/ui/button"
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react"

interface StudentTableErrorProps {
  message?: string
  onRetry?: () => void
}

export function StudentTableError({ 
  message = "Gagal memuat data siswa. Silakan coba lagi.",
  onRetry 
}: StudentTableErrorProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-destructive/20 p-3">
            <IconAlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-destructive">Terjadi Kesalahan</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
