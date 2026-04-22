import { Button } from "@/components/ui/button"
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react"

interface UserTableErrorProps {
  message?: string
  onRetry?: () => void
}

export function UserTableError({ 
  message = "Failed to load users. Please try again.",
  onRetry 
}: UserTableErrorProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-destructive/20 p-3">
            <IconAlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Error Loading Data</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {message}
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
