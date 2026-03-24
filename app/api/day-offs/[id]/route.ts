import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { dayOffs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// GET - Single day-off (all authenticated roles)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const [row] = await db.select().from(dayOffs).where(eq(dayOffs.id, id))
    if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error("GET /api/day-offs/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update day-off (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { date, name } = body

    const updates: Record<string, unknown> = {}
    if (date !== undefined) {
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 })
      }
      updates.date = date
    }
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Nama hari libur wajib diisi" }, { status: 400 })
      }
      updates.name = name.trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 })
    }

    const [updated] = await db
      .update(dayOffs)
      .set(updates)
      .where(eq(dayOffs.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    console.error("PATCH /api/day-offs/[id] error:", error)
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json({ error: "Tanggal ini sudah terdaftar sebagai hari libur" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete day-off (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const [deleted] = await db.delete(dayOffs).where(eq(dayOffs.id, id)).returning()
    if (!deleted) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/day-offs/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
