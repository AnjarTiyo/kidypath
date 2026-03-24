import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { dayOffs, users } from "@/lib/db/schema"
import { desc, eq, asc, and, sql } from "drizzle-orm"

// GET - List all day-offs (all authenticated roles)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")

    const conditions = []
    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${dayOffs.date}::date) = ${parseInt(year)}`)
    }

    const rows = await db
      .select({
        id: dayOffs.id,
        date: dayOffs.date,
        name: dayOffs.name,
        createdBy: dayOffs.createdBy,
        createdAt: dayOffs.createdAt,
        createdByName: users.name,
      })
      .from(dayOffs)
      .leftJoin(users, eq(dayOffs.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(dayOffs.date))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error("GET /api/day-offs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create day-off (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { date, name } = body

    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 })
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama hari libur wajib diisi" }, { status: 400 })
    }

    const [created] = await db
      .insert(dayOffs)
      .values({
        date,
        name: name.trim(),
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error: unknown) {
    console.error("POST /api/day-offs error:", error)
    // Unique constraint violation (duplicate date)
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json({ error: "Tanggal ini sudah terdaftar sebagai hari libur" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
