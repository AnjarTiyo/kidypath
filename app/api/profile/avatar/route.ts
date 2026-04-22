import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { uploadFile, deleteFile, urlToKey } from "@/lib/storage"
import { randomUUID } from "crypto"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "jpg",
  "image/heif": "jpg",
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak diizinkan. Hanya gambar yang diterima." },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 5 MB." },
        { status: 400 }
      )
    }

    // Fetch old avatar URL to delete the old file after successful upload
    const [currentUser] = await db
      .select({ avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const ext = EXT_MAP[file.type] ?? "jpg"
    // Stable key per user — new upload replaces old at the same path
    const key = `avatars/${userId}.${ext}`

    const url = await uploadFile(buffer, key, file.type)

    // If old avatar was stored under a different key (e.g. old extension), remove it
    if (currentUser?.avatarUrl) {
      const oldKey = urlToKey(currentUser.avatarUrl)
      if (oldKey && oldKey !== key) {
        try {
          await deleteFile(oldKey)
        } catch {
          // non-fatal — old file may already be gone
        }
      }
    }

    await db
      .update(users)
      .set({ avatarUrl: url, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return NextResponse.json({ avatarUrl: url }, { status: 201 })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ error: "Gagal mengunggah avatar" }, { status: 500 })
  }
}
