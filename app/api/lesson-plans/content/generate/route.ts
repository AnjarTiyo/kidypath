import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { auth } from "@/auth"
import { buildTopicContextSection } from "@/lib/helpers/topic-helpers"
import { CurrentTopicsPayload } from "@/lib/types/current-topics"

interface GeneratedLessonPlanItem {
    developmentScope: string
    learningGoal: string
    activityContext: string
}

interface GeneratedActivityPhase {
    phase: string
    description: string
}

interface GeneratedLessonPlanResponse {
    items?: GeneratedLessonPlanItem[]
    activities?: GeneratedActivityPhase[]
    materials?: string
}

interface GenerateLessonPlanPayload {
    topic: string
    subtopic?: string | null
    userPrompt?: string
    ageGroup?: string
    currentTopics?: CurrentTopicsPayload | null
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Check if user is admin or teacher
        if (session.user.role !== "admin" && session.user.role !== "teacher") {
            return NextResponse.json(
                { error: "Forbidden: Only admin and teacher can generate lesson plans" },
                { status: 403 }
            )
        }

        const body = (await request.json()) as GenerateLessonPlanPayload
        const { topic, subtopic, userPrompt: userPreferences, ageGroup, currentTopics } = body

        if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            )
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "Groq API key is not configured" },
                { status: 500 }
            )
        }

        const systemPrompt = `You are an expert early childhood education curriculum designer for Indonesian kindergarten (PAUD/TK). 

You MUST create a comprehensive daily lesson plan that covers ALL 6 development scopes, 5 daily activity phases, and a materials list.

CRITICAL: You MUST use EXACTLY these developmentScope values in the items array — never translate or change them:
- "religious_moral"
- "physical_motor"
- "cognitive"
- "language"
- "social_emotional"
- "art"

IMPORTANT: 
- Respond ONLY with valid JSON, no additional text
- Use simple, clear Bahasa Indonesia for all content descriptions
- Make everything age-appropriate and fun
- All content should relate to the daily theme
- Keep descriptions concise but complete (2-3 sentences each)

The 5 required activity phases for the "activities" array are:
1. "kegiatan_awal" - Opening (15 min): circle time, morning prayers, warm-up
2. "kegiatan_inti" - Core (60 min): main learning activities tied to the theme
3. "istirahat" - Break (30 min): snack, free play, toilet time
4. "kegiatan_penutup" - Closing (15 min): recap, reflection, closing prayer
5. "refleksi" - Teacher reflection: observations and notes for improvement

Respond with this exact JSON structure:
{
  "items": [
    { "developmentScope": "religious_moral", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "physical_motor", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "cognitive", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "language", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "social_emotional", "learningGoal": "...", "activityContext": "..." },
    { "developmentScope": "art", "learningGoal": "...", "activityContext": "..." }
  ],
  "activities": [
    { "phase": "kegiatan_awal", "description": "..." },
    { "phase": "kegiatan_inti", "description": "..." },
    { "phase": "istirahat", "description": "..." },
    { "phase": "kegiatan_penutup", "description": "..." },
    { "phase": "refleksi", "description": "..." }
  ],
  "materials": "Daftar alat dan bahan yang dibutuhkan"
}`

        const topicContext = buildTopicContextSection(currentTopics)
        const topicContextSection = topicContext ? `\nKonteks kurikulum saat ini:\n${topicContext}\n` : ''
        const resolvedAgeGroup = ageGroup?.trim() || '4-5 tahun'
        const userPrompt = `Buat rencana pembelajaran harian untuk tema: "${topic}"${subtopic ? ` dengan sub-tema: "${subtopic}"` : ''}.

Tema: ${topic}${subtopic ? `\nSub-tema: ${subtopic}` : ''}
Kelompok Usia: ${resolvedAgeGroup}
${topicContextSection}${userPreferences && userPreferences.trim().length > 0 ? `\nPreferensi tambahan: ${userPreferences}` : ''}

Buat tujuan pembelajaran dan aktivitas untuk SEMUA 6 aspek perkembangan, SEMUA 5 fase kegiatan harian, dan daftar alat dan bahan. Pastikan semua aktivitas praktis dan bisa dilakukan di kelas.`

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            model: process.env.GROQ_AI_MODEL!,
            temperature: 0.7,
            max_tokens: 3000,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" },
        })

        if (!chatCompletion.choices || !Array.isArray(chatCompletion.choices) || chatCompletion.choices.length === 0) {
            console.error("Invalid response structure from Groq API:", chatCompletion)
            return NextResponse.json(
                { error: "Invalid response from AI service" },
                { status: 500 }
            )
        }

        const generatedContent = chatCompletion.choices[0]?.message?.content

        if (!generatedContent) {
            console.error("No content in response:", chatCompletion.choices[0])
            return NextResponse.json(
                { error: "Failed to generate content" },
                { status: 500 }
            )
        }

        let parsedData: GeneratedLessonPlanResponse
        try {
            parsedData = JSON.parse(generatedContent) as GeneratedLessonPlanResponse
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", generatedContent)
            return NextResponse.json(
                { error: "Invalid JSON response from AI service" },
                { status: 500 }
            )
        }

        const requiredScopes = ['religious_moral', 'physical_motor', 'cognitive', 'language', 'social_emotional', 'art']

        // Normalize scope names in case the model returns variations
        const scopeAliases: Record<string, string> = {
            'nilai_agama_dan_moral': 'religious_moral',
            'nilai_agama': 'religious_moral',
            'agama_moral': 'religious_moral',
            'moral': 'religious_moral',
            'fisik_motorik': 'physical_motor',
            'fisik': 'physical_motor',
            'motorik': 'physical_motor',
            'physical': 'physical_motor',
            'kognitif': 'cognitive',
            'bahasa': 'language',
            'sosial_emosional': 'social_emotional',
            'sosial': 'social_emotional',
            'emosional': 'social_emotional',
            'seni': 'art',
        }

        const rawItems = parsedData.items || []
        const items = rawItems.map((item) => ({
            ...item,
            developmentScope: scopeAliases[item.developmentScope] ?? item.developmentScope,
        }))

        if (!Array.isArray(items) || items.length === 0) {
            console.error("AI response has no items:", parsedData)
            return NextResponse.json(
                { error: "AI did not generate any development scope items" },
                { status: 500 }
            )
        }

        const presentScopes = new Set(items.map((item) => item.developmentScope))
        const missingScopes = requiredScopes.filter(scope => !presentScopes.has(scope))
        
        if (missingScopes.length > 0) {
            console.error("AI response missing scopes:", missingScopes, "raw response:", generatedContent)
            return NextResponse.json(
                { error: `AI did not generate all required development scopes: ${missingScopes.join(', ')}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            items: items,
            activities: parsedData.activities || [],
            materials: parsedData.materials || "",
            success: true,
        })
    } catch (error) {
        console.error("Error generating lesson plan content:", error)

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message || "Failed to generate content" },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
