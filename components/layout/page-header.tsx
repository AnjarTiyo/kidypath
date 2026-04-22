import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Icon } from "@tabler/icons-react"

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: Icon
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  description?: string
  subDesc?: React.ReactNode
  actions?: React.ReactNode
  border?: boolean
}

export function PageHeader({
  title,
  breadcrumbs = [],
  description,
  subDesc,
  actions,
  border = true,
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 sm:space-y-4 pb-4 sm:pb-6 ${border ? "border-b" : ""}`}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <div key={index} className="flex items-center space-x-1 sm:space-x-2">
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="flex items-center gap-1 sm:gap-2 font-semibold text-xs sm:text-sm">
                        {item.icon && <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        {item.icon && <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight break-words">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-xs sm:text-sm break-words">{description}</p>
          )}
          {subDesc && <div className="text-muted-foreground text-xs sm:text-sm break-words">{subDesc}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
