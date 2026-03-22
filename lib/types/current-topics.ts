export interface SemesterTopicBrief {
  id: string
  title: string
  description: string | null
  academicYear: string | null
  semesterNumber: number | null
}

export interface MonthlyTopicBrief {
  monthlyTopicId: string
  title: string
  description: string | null
  month: string
  monthNumber: number | null
}

export interface WeeklyTopicBrief {
  weeklyTopicId: string
  title: string
  description: string | null
  weekNumber: number | null
}

export interface CurrentTopicsPayload {
  semester: SemesterTopicBrief | null
  monthly: MonthlyTopicBrief | null
  weekly: WeeklyTopicBrief | null
}

export interface CurrentTopicsResponse {
  data: CurrentTopicsPayload | null
}
