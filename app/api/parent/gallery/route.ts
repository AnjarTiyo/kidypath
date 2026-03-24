import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { students, parentChild, dailyAssessments } from "@/lib/db/schema"
import { eq, and, gte, lte, isNotNull, inArray, desc } from "drizzle-orm"

export interface GalleryChild {
  childName: string
  images: { date: string; imageUrl: string }[]
}

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)

  const defaultEnd = new Date()
  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 30)

  const startDate = searchParams.get("startDate") ?? defaultStart.toISOString().slice(0, 10)
  const endDate = searchParams.get("endDate") ?? defaultEnd.toISOString().slice(0, 10)

  const children = await db
    .select({ id: students.id, fullName: students.fullName })
    .from(parentChild)
    .innerJoin(students, eq(parentChild.childId, students.id))
    .where(eq(parentChild.parentId, session.user.id))

  if (children.length === 0) {
    return NextResponse.json([])
  }

  const childIds = children.map((c) => c.id)

  const images = await db
    .select({
      studentId: dailyAssessments.studentId,
      date: dailyAssessments.date,
      imageUrl: dailyAssessments.imageUrl,
    })
    .from(dailyAssessments)
    .where(
      and(
        inArray(dailyAssessments.studentId, childIds as string[]),
        isNotNull(dailyAssessments.imageUrl),
        gte(dailyAssessments.date, startDate),
        lte(dailyAssessments.date, endDate)
      )
    )
    .orderBy(desc(dailyAssessments.date))

  const result: GalleryChild[] = children.map((child) => ({
    childName: child.fullName ?? "—",
    images: images
      .filter((img) => img.studentId === child.id)
      .map((img) => ({ date: img.date ?? "", imageUrl: img.imageUrl! })),
  }))

  return NextResponse.json(result)
}
