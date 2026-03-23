export type AssessmentScore = "BB" | "MB" | "BSH" | "BSB"

export interface LessonPlanItem {
  id: string
  developmentScope: string
  learningGoal: string
  activityContext: string
}

export interface AssessmentRow {
  scopeId: string
  scopeName: string
  objectiveId: string
  objectiveDescription: string
  activityContext: string
  score: AssessmentScore
  note: string
}

export interface ExistingAssessmentItem {
  scopeId: string
  objectiveId: string
  activityContext: string
  score: AssessmentScore
  note: string | null
}

export interface ExistingAssessment {
  id: string
  studentId: string
  summary: string | null
  imageUrl?: string | null
  items: ExistingAssessmentItem[]
}

export const SCORE_OPTIONS: { value: AssessmentScore; label: string }[] = [
  { value: "BB", label: "BB - Belum Berkembang" },
  { value: "MB", label: "MB - Mulai Berkembang" },
  { value: "BSH", label: "BSH - Berkembang Sesuai Harapan" },
  { value: "BSB", label: "BSB - Berkembang Sangat Baik" },
]

export function getScopeLabel(scopeName: string): string {
  const labelMap: Record<string, string> = {
    religious_moral: "Nilai Agama dan Moral",
    physical_motor: "Fisik Motorik",
    cognitive: "Kognitif",
    language: "Bahasa",
    social_emotional: "Sosial Emosional",
    art: "Seni",
  }
  return labelMap[scopeName] || scopeName
}
