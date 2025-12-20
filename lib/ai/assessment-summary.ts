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

  const systemPrompt = `You are an expert early childhood education (PAUD/TK) teacher in Indonesia who writes clear, warm, and parent-friendly daily journals for kindergarten students.

Your task is to generate a structured "Jurnal Harian Anak" that:
1. Uses simple, positive, and encouraging Bahasa Indonesia
2. Is easy for parents to read quickly
3. Reflects the child’s learning journey for the day
4. Is based on assessment results (BB, MB, BSH, BSB) but written descriptively (do NOT show the codes)
5. Uses emojis to make the journal friendly and engaging
6. Focuses on strengths first, then gentle areas for improvement
7. Is concise and practical

Assessment meaning (for your understanding only):
- BB: Belum Berkembang – needs intensive support
- MB: Mulai Berkembang – needs encouragement
- BSH: Berkembang Sesuai Harapan – on track
- BSB: Berkembang Sangat Baik – very good progress

DO NOT write long narrative paragraphs.
DO NOT use assessment codes (BB/MB/BSH/BSB) in the output.
DO NOT sound clinical or evaluative.
DO NOT sugar coat

Write as a caring teacher speaking to parents but honest.`;

  const userPrompt = `Create a "Jurnal Harian Anak" for PAUD/TK in Bahasa Indonesia with a warm, professional, but HONEST tone.

IMPORTANT PRINCIPLES:
- Be transparent and factual so parents can immediately understand any problems.
- Write what is actually observed, not assumptions or labels.
- Do NOT sugarcoat difficulties, but communicate them respectfully and constructively.
- Focus on observable behavior, consistency, and impact on learning.
- Always balance honesty with encouragement.

Assessment scores (for internal reasoning only — NEVER show the codes):
- BB: Belum Berkembang → child consistently struggles and needs intensive support
- MB: Mulai Berkembang → child shows early signs but is not consistent
- BSH: Berkembang Sesuai Harapan → child performs as expected
- BSB: Berkembang Sangat Baik → child exceeds expectations

You must IMPLICITLY map the assessment data to the wording used.

--------------------------------------------------
OUTPUT FORMAT (STRICTLY FOLLOW THIS STRUCTURE)
--------------------------------------------------

Title:
Jurnal Harian Anak – {Hari, Tanggal}
Tema: {Tema Kegiatan}

🧠 Kegiatan Hari Ini  
Describe 2–3 main activities AND clearly state the child’s level of participation  
(active / needs reminders / needs assistance / not yet consistent).

🌱 Perkembangan yang Terlihat  
Write 2–4 bullet points based on direct observation:
- Clearly state what the child CAN do
- Clearly state what the child STILL STRUGGLES with (if any)
- It is allowed and encouraged to mix progress and difficulties
- Avoid vague phrases like “cukup baik” or “kurang maksimal”

❤️ Catatan Guru  
Write 2–4 sentences that:
1. Describe the child’s emotional state and engagement today  
2. Clearly mention the MAIN challenge (if exists)  
3. Explain how it affects learning or social interaction  
4. End with a hopeful but realistic tone

🚨 Mode Alert (ONLY if there are significant concerns)  
Include this section ONLY if the data indicates BB or MB with noticeable impact.
- Clearly name the concern (focus, emosi, bahasa, sosial, kemandirian, dll)
- Explain why it matters
- Avoid blaming language

🏠 Rekomendasi di Rumah  
- REQUIRED if Mode Alert is active
- Provide 1–2 very specific, easy-to-do activities
- Each recommendation must directly address the identified issue
- Avoid generic advice

--------------------------------------------------
INPUT DATA
--------------------------------------------------

Student Name: ${studentName}  
Date: ${date}  

Assessment Details:
${assessmentContext}

--------------------------------------------------
FINAL CHECK BEFORE OUTPUT
--------------------------------------------------
- Parents should immediately understand:
  • what went well
  • what is not yet developing
  • what needs attention
- The tone must feel caring, not judgmental
- The journal must be suitable to send directly to parents without edits
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
