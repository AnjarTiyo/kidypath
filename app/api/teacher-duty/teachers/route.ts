import { NextResponse } from "next/server"
import { auth, isCurriculumCoordinatorSession } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

// GET - List all users with role = 'teacher'
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAllowed =
      ["admin", "teacher"].includes(session.user.role ?? "") ||
      isCurriculumCoordinatorSession(session)
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const teacherList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isCurriculumCoordinator: users.isCurriculumCoordinator,
      })
      .from(users)
      .where(eq(users.role, "teacher"))
      .orderBy(asc(users.name))

    return NextResponse.json({ data: teacherList })
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
