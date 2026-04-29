import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { auth } from "@/auth"
import { buildTopicContextSection } from "@/lib/helpers/topic-helpers"
import { CurrentTopicsPayload } from "@/lib/types/current-topics"

interface AgendaItem {
  developmentScope: string
  learningGoal: string
  activityContext: string
}

interface GenerateActivitiesPayload {
  topic: string
  subtopic?: string | null
  ageGroup?: string
  items?: AgendaItem[]
  currentTopics?: CurrentTopicsPayload | null
  userPrompt?: string
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SCOPE_LABELS: Record<string, string> = {
  religious_moral: "Nilai Agama & Moral",
  physical_motor: "Fisik-Motorik",
  cognitive: "Kognitif",
  language: "Bahasa",
  social_emotional: "Sosial-Emosional",
  art: "Seni",
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (
      session.user.role !== "admin" &&
      session.user.role !== "teacher" &&
      !session.user.isCurriculumCoordinator
    ) {
      return NextResponse.json({ error: "Forbidden: Not Allowed" }, { status: 403 })
    }

    const body = (await request.json()) as GenerateActivitiesPayload
    const { topic, subtopic, ageGroup, items, currentTopics, userPrompt } = body

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Groq API key is not configured" }, { status: 500 })
    }

    const topicContext = buildTopicContextSection(currentTopics ?? null)
    const resolvedAgeGroup = ageGroup?.trim() || "4-5 tahun"

    // Build agenda summary for context (smaller than full items)
    const agendaSummary =
      items && items.length > 0
        ? items
            .map(
              (item) =>
                `- ${SCOPE_LABELS[item.developmentScope] ?? item.developmentScope}: ${item.learningGoal}`
            )
            .join("\n")
        : ""

    const systemPrompt = `Kamu adalah perancang kurikulum PAUD/TK Indonesia yang berpengalaman.

Buat rangkaian kegiatan harian (5 fase) dan daftar alat & bahan yang konsisten dengan rincian agenda.

PENTING:
- Respons HANYA dengan JSON valid, tanpa teks tambahan
- Gunakan TEPAT nilai phase berikut: "kegiatan_awal", "kegiatan_inti", "istirahat", "kegiatan_penutup", "refleksi"
- Bahasa Indonesia yang jelas dan praktis

Keterangan fase:
1. "kegiatan_awal" (~15 menit): circle time, berdoa, salam, pemanasan/ice breaking
2. "kegiatan_inti" (~60 menit): kegiatan belajar utama yang mengintegrasikan aspek perkembangan
3. "istirahat" (~30 menit): cuci tangan, makan bekal, bermain bebas
4. "kegiatan_penutup" (~15 menit): recap, refleksi anak, doa penutup
5. "refleksi" (catatan guru): observasi perkembangan anak hari ini

Format JSON yang wajib:
{
  "activities": [
    { "phase": "kegiatan_awal", "description": "..." },
    { "phase": "kegiatan_inti", "description": "..." },
    { "phase": "istirahat", "description": "..." },
    { "phase": "kegiatan_penutup", "description": "..." },
    { "phase": "refleksi", "description": "..." }
  ],
  "materials": "Daftar lengkap alat dan bahan yang dibutuhkan"
}`

    const userMessage = `Tema: "${topic}"${subtopic ? ` / Sub-tema: "${subtopic}"` : ""}
Kelompok Usia: ${resolvedAgeGroup}
${agendaSummary ? `\nRincian agenda yang telah dibuat:\n${agendaSummary}\n` : ""}${topicContext ? `\nKonteks kurikulum saat ini:\n${topicContext}\n` : ""}${userPrompt?.trim() ? `\nPreferensi tambahan: ${userPrompt}` : ""}

Buat rangkaian kegiatan harian yang kohesif dan menyenangkan. Kegiatan inti harus mengintegrasikan aspek-aspek perkembangan dari rincian agenda. Sertakan daftar alat dan bahan yang konkret.`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: process.env.GROQ_AI_MODEL!,
      temperature: 0.7,
      max_tokens: 1800,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "No content from AI service" }, { status: 500 })
    }

    let parsed: { activities?: Array<{ phase: string; description: string }>; materials?: string | string[] }
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: "Invalid JSON response from AI service" }, { status: 500 })
    }

    const activities = parsed.activities || []
    const rawMaterials = parsed.materials
    const materials = Array.isArray(rawMaterials)
      ? rawMaterials.join(", ")
      : rawMaterials || ""

    if (activities.length === 0) {
      return NextResponse.json({ error: "AI did not generate any activities" }, { status: 500 })
    }

    return NextResponse.json({ activities, materials, success: true })
  } catch (error) {
    console.error("Error generating activities:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate activities" },
      { status: 500 }
    )
  }
}
