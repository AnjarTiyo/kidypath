import { NextRequest, NextResponse } from "next/server"
import { auth, isCurriculumCoordinatorSession } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

async function checkAuth() {
  const session = await auth()
  if (!session?.user) return null
  const isAllowed =
    session.user.role === "admin" || isCurriculumCoordinatorSession(session)
  return isAllowed ? session : null
}

// DELETE - Remove a teacher from duty (set isCurriculumCoordinator = false)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify user exists and is a teacher
    const [teacher] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "teacher")))
      .limit(1)

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    await db
      .update(users)
      .set({ isCurriculumCoordinator: false, updatedAt: new Date() })
      .where(eq(users.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing duty teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
