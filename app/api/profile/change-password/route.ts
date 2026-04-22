import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, verifyPassword } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Password saat ini wajib diisi" },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru harus minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Fetch current hash from DB
    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(newPassword)

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return NextResponse.json({ message: "Password berhasil diubah" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
