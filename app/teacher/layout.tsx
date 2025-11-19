"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { useSelectedLayoutSegments } from "next/navigation";
import { TeacherSidebar } from "@/components/layout/teacher/teacher-sidebar";
import { TeacherBottomNav } from "@/components/layout/teacher-bottom-nav";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segments = useSelectedLayoutSegments();

  // Build list of breadcrumb items
  let path = "";
  const crumbs = segments.map((segment) => {
    path += `/${segment}`;
    return {
      label: formatLabel(segment),
      href: path,
    };
  });

  return (
    <SidebarProvider>
      <TeacherSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              {/* Root "Portal Guru" */}
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/teacher">Portal Guru</BreadcrumbLink>
              </BreadcrumbItem>

              {segments.length > 0 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}

              {/* Dynamic segments */}
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <BreadcrumbItem key={index}>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                    {!isLast && <BreadcrumbSeparator />}
                  </BreadcrumbItem>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
      <TeacherBottomNav />
    </SidebarProvider>
  );
}

/**
 * 🔤 Helper untuk mengubah "data-guru" => "Data Guru"
 */
function formatLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
