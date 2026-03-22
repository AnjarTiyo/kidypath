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

interface GeneratedLessonPlanResponse {
    items?: GeneratedLessonPlanItem[]
}

interface GenerateLessonPlanPayload {
    topic: string
    subtopic?: string | null
    userPrompt?: string
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
        const { topic, subtopic, userPrompt: userPreferences, currentTopics } = body

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

You MUST create a comprehensive daily lesson plan that covers ALL 6 development scopes (aspek perkembangan) required by Indonesian curriculum.

For each development scope, provide:
1. A specific, measurable learning goal (tujuan pembelajaran)
2. A practical, engaging activity description (konteks/aktivitas)

IMPORTANT: 
- Respond ONLY with valid JSON, no additional text
- Use simple, clear Bahasa Indonesia
- Make activities age-appropriate and fun
- All activities should relate to the daily theme
- Keep descriptions concise but complete (2-3 sentences each)

The 6 required development scopes are:
1. Nilai Agama dan Moral (religious_moral) - Religious and moral values
2. Fisik-Motorik (physical_motor) - Physical and motor development
3. Kognitif (cognitive) - Cognitive development
4. Bahasa (language) - Language development
5. Sosial-Emosional (social_emotional) - Social and emotional development
6. Seni (art) - Art and creativity

Respond with this exact JSON structure:
{
  "items": [
    {
      "developmentScope": "religious_moral",
      "learningGoal": "Tujuan pembelajaran untuk aspek agama dan moral",
      "activityContext": "Deskripsi aktivitas untuk mencapai tujuan"
    },
    ... (5 more items for other scopes)
  ]
}`

        const topicContext = buildTopicContextSection(currentTopics)
        const topicContextSection = topicContext ? `\nKonteks kurikulum saat ini:\n${topicContext}\n` : ''
        const userPrompt = `Create a daily lesson plan for the theme: "${topic}"${subtopic ? ` with subtopic: "${subtopic}"` : ''}.

Theme: ${topic}${subtopic ? `\nSubtopic: ${subtopic}` : ''}
Age Group: 4-5 years (KB/TK A) or 5-6 years (TK B)
${topicContextSection}${userPreferences && userPreferences.trim().length > 0 ? `\nAdditional preferences: ${userPreferences}` : ''}

Generate learning goals and activities for ALL 6 development scopes. Make sure all activities are practical and can be done in a classroom setting.`

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
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 2000,
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
        const items = parsedData.items || []
        
        if (!Array.isArray(items) || items.length !== 6) {
            console.error("AI response missing required items:", items)
            return NextResponse.json(
                { error: "AI did not generate all required development scopes" },
                { status: 500 }
            )
        }

        const presentScopes = new Set(items.map((item) => item.developmentScope))
        const missingScopes = requiredScopes.filter(scope => !presentScopes.has(scope))
        
        if (missingScopes.length > 0) {
            console.error("AI response missing scopes:", missingScopes)
            return NextResponse.json(
                { error: `Missing development scopes: ${missingScopes.join(', ')}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            items: items,
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
