import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { assessmentItems, dailyAssessments, developmentScopes } from "@/lib/db/schema"
import { sql, and, gte, lte, eq } from "drizzle-orm"
import { subDays, format } from "date-fns"

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: "Nilai Agama Moral",
  physical_motor: "Fisik Motorik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosial Emosi",
  art: "Seni",
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd")
    const startDate = searchParams.get("startDate") || format(subDays(new Date(), 29), "yyyy-MM-dd")
    const classroomId = searchParams.get("classroomId")

    const daConditions = [
      gte(dailyAssessments.date, startDate),
      lte(dailyAssessments.date, endDate),
    ]
    if (classroomId) daConditions.push(eq(dailyAssessments.classroomId, classroomId))

    // School-wide avg score per scope
    const scopeRows = await db
      .select({
        scopeName: developmentScopes.name,
        avgScore: sql<number>`AVG(CASE ${assessmentItems.score}
          WHEN 'BB' THEN 1
          WHEN 'MB' THEN 2
          WHEN 'BSH' THEN 3
          WHEN 'BSB' THEN 4
        END)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(assessmentItems)
      .innerJoin(dailyAssessments, eq(assessmentItems.dailyAssessmentId, dailyAssessments.id))
      .innerJoin(developmentScopes, eq(assessmentItems.scopeId, developmentScopes.id))
      .where(and(...daConditions))
      .groupBy(developmentScopes.name)

    const scopes = scopeRows.map((r) => ({
      scope: r.scopeName,
      label: SCOPE_LABELS[r.scopeName || ""] || r.scopeName || "",
      avgScore: r.avgScore ? Math.round(Number(r.avgScore) * 100) / 100 : 0,
      count: Number(r.count),
    }))

    return NextResponse.json({ scopes })
  } catch (error) {
    console.error("[dashboard/development-progress]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
