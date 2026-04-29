import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { auth } from "@/auth"
import { buildTopicContextSection } from "@/lib/helpers/topic-helpers"
import { CurrentTopicsPayload } from "@/lib/types/current-topics"

interface GenerateAgendaPayload {
  topic: string
  subtopic?: string | null
  ageGroup?: string
  currentTopics?: CurrentTopicsPayload | null
  userPrompt?: string
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

    const body = (await request.json()) as GenerateAgendaPayload
    const { topic, subtopic, ageGroup, currentTopics, userPrompt } = body

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Groq API key is not configured" }, { status: 500 })
    }

    const topicContext = buildTopicContextSection(currentTopics ?? null)
    const resolvedAgeGroup = ageGroup?.trim() || "4-5 tahun"

    const systemPrompt = `Kamu adalah perancang kurikulum PAUD/TK Indonesia yang berpengalaman.

Buat rincian agenda pembelajaran dengan tujuan pembelajaran dan konteks aktivitas untuk SEMUA 6 aspek perkembangan.

PENTING:
- Respons HANYA dengan JSON valid, tanpa teks tambahan
- Gunakan TEPAT nilai developmentScope berikut (jangan diterjemahkan):
  "religious_moral", "physical_motor", "cognitive", "language", "social_emotional", "art"
- Bahasa Indonesia yang jelas dan praktis
- Sesuai usia anak ${resolvedAgeGroup}

Format JSON yang wajib:
{
  "items": [
    { "developmentScope": "religious_moral", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "physical_motor", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "cognitive", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "language", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "social_emotional", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "art", "learningGoal": "...", "activityContext": "..." }
  ]
}`

    const userMessage = `Tema: "${topic}"${subtopic ? ` / Sub-tema: "${subtopic}"` : ""}
Kelompok Usia: ${resolvedAgeGroup}
${topicContext ? `\nKonteks kurikulum saat ini:\n${topicContext}\n` : ""}${userPrompt?.trim() ? `\nPreferensi tambahan: ${userPrompt}` : ""}

Buat tujuan pembelajaran (learningGoal) yang spesifik dan terukur, serta aktivitas (activityContext) yang praktis dan menyenangkan untuk SEMUA 6 aspek perkembangan. Semua aktivitas harus relevan dengan tema "${topic}".`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: process.env.GROQ_AI_MODEL!,
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "No content from AI service" }, { status: 500 })
    }

    let parsed: { items?: Array<{ developmentScope: string; learningGoal: string; activityContext: string }> }
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: "Invalid JSON response from AI service" }, { status: 500 })
    }

    const scopeAliases: Record<string, string> = {
      nilai_agama_dan_moral: "religious_moral",
      nilai_agama: "religious_moral",
      agama_moral: "religious_moral",
      moral: "religious_moral",
      fisik_motorik: "physical_motor",
      fisik: "physical_motor",
      motorik: "physical_motor",
      physical: "physical_motor",
      kognitif: "cognitive",
      bahasa: "language",
      sosial_emosional: "social_emotional",
      sosial: "social_emotional",
      emosional: "social_emotional",
      seni: "art",
    }

    const items = (parsed.items || []).map((item) => ({
      ...item,
      developmentScope: scopeAliases[item.developmentScope] ?? item.developmentScope,
    }))

    const requiredScopes = [
      "religious_moral",
      "physical_motor",
      "cognitive",
      "language",
      "social_emotional",
      "art",
    ]
    const presentScopes = new Set(items.map((i) => i.developmentScope))
    const missing = requiredScopes.filter((s) => !presentScopes.has(s))

    if (items.length === 0 || missing.length > 0) {
      return NextResponse.json(
        { error: `AI tidak menghasilkan semua aspek perkembangan: ${missing.join(", ")}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ items, success: true })
  } catch (error) {
    console.error("Error generating agenda:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate agenda" },
      { status: 500 }
    )
  }
}
