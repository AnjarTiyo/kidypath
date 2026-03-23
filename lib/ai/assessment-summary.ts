import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface AssessmentItem {
  scopeName: string;
  objectiveDescription: string;
  activityContext: string;
  score: string;
  note?: string | null;
}

interface GenerateSummaryParams {
  studentName: string;
  date: string;
  assessmentItems: AssessmentItem[];
}

export async function generateAssessmentSummary({
  studentName,
  date,
  assessmentItems,
}: GenerateSummaryParams): Promise<string> {
  // Check if Groq API key is configured
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key is not configured");
  }

  // Build context from assessment items
  const assessmentContext = assessmentItems
    .map((item, index) => {
      return `${index + 1}. ${item.scopeName}:
   - Tujuan: ${item.objectiveDescription}
   - Aktivitas: ${item.activityContext}
   - Capaian: ${item.score}${item.note ? `\n   - Catatan: ${item.note}` : ""}`;
    })
    .join("\n\n");

  const systemPrompt = `
You are an experienced PAUD/TK teacher in Indonesia who writes clear, warm, and honest daily journals for parents.

Your role is to write daily student journals that are:
- Warm, caring, and respectful
- Honest and transparent (not sugarcoated)
- Easy for parents to read quickly
- Based strictly on observable behavior (not assumptions)

WRITING RULES:
- ALWAYS write the final output in Bahasa Indonesia
- Use simple, natural, parent-friendly language
- Keep sentences short and clear
- Avoid long paragraphs
- Use emojis moderately to keep it engaging

TONE:
- Supportive but honest
- Not judgmental
- Not overly formal or clinical

ASSESSMENT INTERPRETATION (internal only — NEVER show codes):
- BB: child is not yet able and needs full support
- MB: child is starting but inconsistent
- BSH: child is independent and consistent
- BSB: child exceeds expectations and may help others

Translate assessment data into natural descriptive language.
Never mention BB, MB, BSH, or BSB in the output.
`;

const userPrompt = `
Create a "Jurnal Harian Anak" based on the data below.

IMPORTANT:
- Output MUST be in Bahasa Indonesia
- Be honest, clear, and based on real observation
- Do NOT sugarcoat difficulties
- Focus on behavior, consistency, and learning impact

--------------------------------------------------
OUTPUT STRUCTURE (STRICT)
--------------------------------------------------

Jurnal Harian Anak – {Hari, Tanggal}  
Tema: {Tema Kegiatan}

🧠 Kegiatan Hari Ini  
- Describe 2–3 main activities
- Clearly state participation level:
  (aktif / perlu diingatkan / perlu dibantu / belum konsisten)

🌱 Perkembangan yang Terlihat  
(2–4 bullet points)
- What the child CAN do
- What the child STILL STRUGGLES with (if any)
- Use specific, observable behavior
- Avoid vague phrases like “cukup baik”

❤️ Catatan Guru  
(2–4 sentences)
- Emotional condition and engagement
- Main challenge (if any)
- Impact on learning or social interaction
- End with a realistic but hopeful tone

🚨 Perlu Perhatian  
(ONLY if there are significant concerns)
- Mention specific area: focus, emotion, communication, social, independence, etc.
- Explain why it matters
- Use neutral, non-blaming language

🏠 Rekomendasi di Rumah  
(REQUIRED if "Perlu Perhatian" exists)
- 1–2 specific and simple activities
- Must directly address the issue
- Avoid generic advice

--------------------------------------------------
INPUT DATA
--------------------------------------------------

Student Name: ${studentName}  
Date: ${date}  

Assessment Details:
${assessmentContext}

--------------------------------------------------
FINAL VALIDATION
--------------------------------------------------
Ensure parents can instantly understand:
- What went well
- What is not yet developing
- What needs attention

The journal must be ready to send without edits.
`;

  try {
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
      max_tokens: 500,
      top_p: 1,
      stream: false,
    });

    const summary = chatCompletion.choices[0]?.message?.content;

    if (!summary) {
      throw new Error("Failed to generate summary from AI");
    }

    return summary.trim();
  } catch (error) {
    console.error("Error generating assessment summary:", error);
    throw error;
  }
}
