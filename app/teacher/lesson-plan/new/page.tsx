import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import LessonPlanNewPageClient, { lessonPlanBreadcrumbs } from "./lesson-plan-new-client"

const pageFallback = (
  <div className="h-screen flex flex-col items-center justify-center">
    <PageHeader
      title="Buat Rencana Pembelajaran Baru"
      description="Buat rencana pembelajaran komprehensif untuk semua aspek perkembangan"
      breadcrumbs={lessonPlanBreadcrumbs}
    />
    <Card>
      <CardContent className="py-6">
        <p className="text-center text-muted-foreground">Memuat halaman...</p>
      </CardContent>
    </Card>
  </div>
)

export default function NewLessonPlanPage() {
  return (
    <Suspense fallback={pageFallback}>
      <LessonPlanNewPageClient />
    </Suspense>
  )
}