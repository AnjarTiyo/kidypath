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
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  breadcrumbs = [],
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-4 pb-6 border-b">
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <div key={index} className="flex items-center space-x-2">
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="flex items-center gap-2 font-semibold">
                        {item.icon && <item.icon className="h-3.5 w-3.5" />}
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href} className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-3.5 w-3.5" />}
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

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
