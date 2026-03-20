/**
 * AI Lesson Plan Generator
 * 
 * This module handles AI-powered generation of lesson plans with learning goals
 * and activities for all development scopes.
 */

import { buildTopicContextSection } from "@/lib/helpers/topic-helpers"
import { CurrentTopicsPayload } from "@/lib/types/current-topics"
import { DevelopmentScope, DEVELOPMENT_SCOPES } from "@/lib/types/development-scope"

export interface LessonPlanItemData {
  developmentScope: DevelopmentScope;
  learningGoal: string;
  activityContext: string;
}

export interface GeneratedLessonPlan {
  title: string;
  items: LessonPlanItemData[];
}

/**
 * Generate a complete lesson plan with all 6 development scopes
 * 
 * @param theme - The theme or topic for the daily lesson plan
 * @param ageGroup - The age group of students (e.g., "4-5 years", "5-6 years")
 * @param classroomContext - Additional context about the classroom
 * @param currentTopics - Optional curriculum topics that inform the prompt
 * @returns A complete lesson plan with items for all development scopes
 */
export async function generateLessonPlan(
  theme: string,
  ageGroup: string = "4-5 years",
  classroomContext?: string,
  currentTopics?: CurrentTopicsPayload | null
): Promise<GeneratedLessonPlan> {
  // TODO: Integrate with actual AI service (OpenAI, Anthropic, etc.)
  // For now, return a template structure
  
  const prompt = buildLessonPlanPrompt(theme, ageGroup, classroomContext, currentTopics);
  
  // Placeholder: In production, call your AI service here
  // const aiResponse = await callAIService(prompt);
  
  // For now, return a structured template
  return generateTemplateLessonPlan(theme);
}

/**
 * Build the AI prompt for lesson plan generation
 */
function buildLessonPlanPrompt(
  theme: string,
  ageGroup: string,
  classroomContext?: string,
  currentTopics?: CurrentTopicsPayload | null
): string {
  const topicContext = buildTopicContextSection(currentTopics)
  return `
You are an expert early childhood education curriculum designer for Indonesian kindergarten (PAUD/TK).

Create a comprehensive daily lesson plan with the following details:
- Theme: ${theme}
- Age Group: ${ageGroup}
${classroomContext ? `- Classroom Context: ${classroomContext}` : ''}
${topicContext ? `- Topik kurikulum saat ini:
${topicContext}` : ''}

The lesson plan must include activities for ALL 6 development scopes required by Indonesian curriculum:

1. **Nilai Agama dan Moral (Religious & Moral Values)**
   - Learning Goal: What religious/moral value will be developed?
   - Activity: What activity will achieve this goal?

2. **Fisik-Motorik (Physical & Motor Development)**
   - Learning Goal: What physical/motor skill will be developed?
   - Activity: What activity will achieve this goal?

3. **Kognitif (Cognitive Development)**
   - Learning Goal: What cognitive skill will be developed?
   - Activity: What activity will achieve this goal?

4. **Bahasa (Language Development)**
   - Learning Goal: What language skill will be developed?
   - Activity: What activity will achieve this goal?

5. **Sosial-Emosional (Social & Emotional Development)**
   - Learning Goal: What social/emotional skill will be developed?
   - Activity: What activity will achieve this goal?

6. **Seni (Art & Creativity)**
   - Learning Goal: What artistic/creative skill will be developed?
   - Activity: What activity will achieve this goal?

Requirements:
- All activities should be age-appropriate and engaging
- Activities should be practical and implementable in a classroom setting
- Learning goals should be specific and measurable
- Activities should relate to the daily theme: "${theme}"
- Use Indonesian educational terminology
- Keep activities simple and fun

Format your response as a JSON object with this structure:
{
  "title": "Theme title",
  "items": [
    {
      "developmentScope": "religious_moral",
      "learningGoal": "Specific learning goal",
      "activityContext": "Detailed activity description"
    },
    // ... for all 6 scopes
  ]
}
`.trim();
}

/**
 * Generate a template lesson plan (fallback when AI is not available)
 */
function generateTemplateLessonPlan(theme: string): GeneratedLessonPlan {
  const developmentScopes = DEVELOPMENT_SCOPES;

  const templates = {
    religious_moral: {
      goal: `Anak mampu menunjukkan sikap syukur atas ciptaan Tuhan terkait tema "${theme}"`,
      activity: `Berdoa bersama sebelum kegiatan, berdiskusi tentang nikmat Tuhan terkait ${theme}, dan mengucapkan terima kasih`
    },
    physical_motor: {
      goal: `Anak mampu mengembangkan koordinasi motorik kasar dan halus melalui kegiatan bertema "${theme}"`,
      activity: `Melakukan gerakan fisik terkait ${theme} (motorik kasar) dan membuat karya dengan menggunting/menempel (motorik halus)`
    },
    cognitive: {
      goal: `Anak mampu mengenal konsep dan karakteristik terkait "${theme}"`,
      activity: `Mengamati, mengelompokkan, dan menghitung benda-benda terkait ${theme}, serta memecahkan masalah sederhana`
    },
    language: {
      goal: `Anak mampu menyimak, memahami, dan menceritakan kembali informasi tentang "${theme}"`,
      activity: `Mendengarkan cerita tentang ${theme}, menjawab pertanyaan, dan bercerita dengan bahasa sendiri`
    },
    social_emotional: {
      goal: `Anak mampu bekerja sama dan berempati dalam kegiatan bertema "${theme}"`,
      activity: `Melakukan kegiatan kelompok terkait ${theme}, berbagi tugas, dan saling membantu teman`
    },
    art: {
      goal: `Anak mampu mengekspresikan kreativitas dan imajinasi tentang "${theme}"`,
      activity: `Membuat karya seni (menggambar, mewarnai, atau prakarya) dengan tema ${theme} sesuai kreativitas masing-masing`
    }
  };

  return {
    title: theme,
    items: developmentScopes.map(scope => ({
      developmentScope: scope,
      learningGoal: templates[scope].goal,
      activityContext: templates[scope].activity
    }))
  };
}

/**
 * Validate that a lesson plan has all required development scopes
 */
export function validateLessonPlan(lessonPlan: GeneratedLessonPlan): boolean {
  const requiredScopes = DEVELOPMENT_SCOPES;

  const presentScopes = new Set(lessonPlan.items.map(item => item.developmentScope));

  return requiredScopes.every(scope => presentScopes.has(scope));
}

/**
 * Get display name for development scope in Indonesian
 */
export function getDevelopmentScopeLabel(scope: DevelopmentScope): string {
  const labels: Record<DevelopmentScope, string> = {
    religious_moral: 'Nilai Agama dan Moral',
    physical_motor: 'Fisik-Motorik',
    cognitive: 'Kognitif',
    language: 'Bahasa',
    social_emotional: 'Sosial-Emosional',
    art: 'Seni'
  };

  return labels[scope];
}
