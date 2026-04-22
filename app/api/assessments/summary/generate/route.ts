import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAssessmentSummary } from "@/lib/ai/assessment-summary";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or teacher
    if (session.user.role !== "admin" && session.user.role !== "teacher" && !session.user.isCurriculumCoordinator) {
      return NextResponse.json(
        { error: "Forbidden: Only admin and teacher can generate summaries" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentName, date, assessmentItems } = body;

    // Validate required fields
    if (!studentName || !date || !assessmentItems || !Array.isArray(assessmentItems)) {
      return NextResponse.json(
        { error: "Missing required fields: studentName, date, and assessmentItems are required" },
        { status: 400 }
      );
    }

    if (assessmentItems.length === 0) {
      return NextResponse.json(
        { error: "At least one assessment item is required" },
        { status: 400 }
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 }
      );
    }

    // Generate summary using AI
    const summary = await generateAssessmentSummary({
      studentName,
      date,
      assessmentItems,
    });

    return NextResponse.json({
      summary,
      success: true,
    });
  } catch (error) {
    console.error("Error generating assessment summary:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to generate summary" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
