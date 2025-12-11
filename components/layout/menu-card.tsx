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
}: MenuCardProps) {
  const content = (
    <div
      className={cn(
        "group relative flex flex-row items-start gap-4 p-6 rounded-lg border bg-card text-card-foreground transition-all",
        "hover:shadow-md hover:border-primary/50 hover:-translate-y-1",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer active:scale-95",
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors",
          "group-hover:bg-primary group-hover:text-primary-foreground",
          iconClassName
        )}
      >
        <Icon size={28} stroke={1.5} />
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-1">
        <h3 className="font-semibold text-md leading-none tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
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
        "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}
