import { DotLottieReact } from "@lottiefiles/dotlottie-react"

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = "Memuat data...", className }: LoadingStateProps) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background ${className ?? ""}`}>
      <DotLottieReact
        src="/animations/loading.lottie"
        loop
        autoplay
        style={{ width: 200, height: 200 }}
      />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}
