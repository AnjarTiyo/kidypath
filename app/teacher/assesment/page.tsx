import { Suspense } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import StudentAssessmentClient from "./student-assessment-client"

const pageFallback = (
  <div className="flex items-center justify-center min-h-[400px]">
    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)

export default function StudentAssessmentPage() {
  return (
    <Suspense fallback={pageFallback}>
      <StudentAssessmentClient />
    </Suspense>
  )
}
