import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { auth } from "@/auth"

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

        const body = await request.json()
        const { title, userPrompt } = body

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            )
        }

        // Check if Groq API key is configured
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "Groq API key is not configured" },
                { status: 500 }
            )
        }

        // Build the prompt
        let prompt = `Generate lesson plan content for KB and TK using Bahasa Indonesia if the title is "${title}". Make it concise and maximum 1 paragraph contain 3 sentences.`

        if (userPrompt && userPrompt.trim().length > 0) {
            prompt += ` Here it is the user preferences: ${userPrompt}`
        }

        // Call Groq API (use non-streaming response so `choices` is available)
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that generates lesson plan content for kindergarten (KB and TK) in Bahasa Indonesia. Always respond in PLAIN TEXT ONLY (no markdown, no formatting, no asterisks, no special characters). Keep the content educational and age-appropriate. Write in simple, clear Bahasa Indonesia. keep simple as posible, do not use complex words or sentences. Use applicable tone for kindergarten teachers. This activities is for whole day learning plan.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "openai/gpt-oss-safeguard-20b", // Using a reliable Groq model
            temperature: 0.7,
            max_tokens: 500,
            top_p: 1,
            stream: false,
            reasoning_effort: "low",
        })

        // Log the response for debugging
        // console.log("Groq API Response:", JSON.stringify(chatCompletion, null, 2))

        // Check if response has the expected structure
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

        return NextResponse.json({
            content: generatedContent.trim(),
            success: true,
        })
    } catch (error) {
        console.error("Error generating lesson plan content:", error)

        // Handle Groq API specific errors
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
