import Link from "next/link"
import { type Icon as TablerIcon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export interface MenuCardProps {
  title: string
  description: string
  icon: TablerIcon
  href?: string
  onClick?: () => void
  className?: string
  iconClassName?: string
  disabled?: boolean
  hidden?: boolean
}

export function MenuCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  className,
  iconClassName,
  disabled = false,
  hidden = false,
}: MenuCardProps) {
  if (hidden) {
    return null
  }

  const content = (
    <div
      className={cn(
        "group relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 rounded-lg border bg-card text-card-foreground transition-all",
        "hover:shadow-md hover:border-secondary/50 hover:-translate-y-1",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer active:scale-95",
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "flex h-12 w-12 sm:h-13 sm:w-13 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors",
          "group-hover:bg-secondary group-hover:text-secondary-foreground",
          iconClassName
        )}
      >
        <Icon size={24} stroke={1.5} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-1 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base md:text-md leading-none tracking-tight break-words">
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 break-words">
          {description}
        </p>
      </div>
    </div>
  )

  if (disabled) {
    return content
  }

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full">
        {content}
      </button>
    )
  }

  return content
}

interface MenuGridProps {
  children: React.ReactNode
  className?: string
}

export function MenuGrid({ children, className }: MenuGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}
