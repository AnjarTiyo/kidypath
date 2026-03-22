import { NextRequest, NextResponse } from "next/server"
import { auth, isCurriculumCoordinatorSession } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

// Read access: teachers, admins, and curriculum coordinators
async function checkReadAuth() {
  const session = await auth()
  if (!session?.user) return null
  const isAllowed =
    ["admin", "teacher"].includes(session.user.role ?? "") ||
    isCurriculumCoordinatorSession(session)
  return isAllowed ? session : null
}

// Write access: admins and curriculum coordinators only
async function checkWriteAuth() {
  const session = await auth()
  if (!session?.user) return null
  const isAllowed =
    session.user.role === "admin" || isCurriculumCoordinatorSession(session)
  return isAllowed ? session : null
}

// GET - List teachers currently on duty (isCurriculumCoordinator = true AND role = 'teacher')
export async function GET() {
  try {
    const session = await checkReadAuth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dutyTeachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isCurriculumCoordinator: users.isCurriculumCoordinator,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "teacher"),
          eq(users.isCurriculumCoordinator, true)
        )
      )

    return NextResponse.json({ data: dutyTeachers })
  } catch (error) {
    console.error("Error fetching duty teachers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Assign a teacher as on duty
export async function POST(request: NextRequest) {
  try {
    const session = await checkWriteAuth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { teacherId } = body

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId is required" }, { status: 400 })
    }

    // Verify the user exists and has role = teacher
    const [teacher] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1)

    if (!teacher) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (teacher.role !== "teacher") {
      return NextResponse.json({ error: "User is not a teacher" }, { status: 400 })
    }

    const [updated] = await db
      .update(users)
      .set({ isCurriculumCoordinator: true, updatedAt: new Date() })
      .where(eq(users.id, teacherId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        isCurriculumCoordinator: users.isCurriculumCoordinator,
      })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Error assigning duty teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
