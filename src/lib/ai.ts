/**
 * AI service for blueprint and content generation. Uses OpenAI with optional BYO key.
 */

import OpenAI from "openai";

export function getOpenAIClient(apiKey?: string | null): OpenAI | null {
  const key = apiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export interface BlueprintContext {
  title: string;
  overview?: string | null;
  audience?: string | null;
  targetWordCount?: number | null;
  tone?: string | null;
  complianceLevel?: string | null;
}

export type BlueprintSection =
  | "description"
  | "modules"
  | "lessons"
  | "ilos"
  | "assessmentPlan";

export interface BlueprintData {
  description?: string;
  modules?: { title: string }[];
  lessons?: { moduleIndex: number; title: string }[];
  ilos?: string[];
  assessmentPlan?: string;
}

export async function generateBlueprintSection(
  client: OpenAI,
  context: BlueprintContext,
  section: BlueprintSection,
  currentBlueprint?: BlueprintData
): Promise<Partial<BlueprintData>> {
  const basePrompt = `You are an instructional designer. Given this course context, produce only the requested section in valid JSON. No markdown, no explanation.
Course title: ${context.title}
${context.overview ? `Overview: ${context.overview}` : ""}
${context.audience ? `Audience: ${context.audience}` : ""}
${context.targetWordCount ? `Target word count for whole course: ${context.targetWordCount} words` : ""}
${context.tone ? `Tone: ${context.tone}` : ""}
${context.complianceLevel ? `Compliance: ${context.complianceLevel}` : ""}
`;

  if (section === "description") {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: basePrompt + 'Respond with a JSON object: { "description": "2-4 sentence course description" }' },
        { role: "user", content: "Generate the course description." },
      ],
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as { description: string };
  }

  if (section === "modules") {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: basePrompt + 'Respond with a JSON object: { "modules": [ { "title": "Module 1 title" }, ... ] }. Suggest 3-6 modules.' },
        { role: "user", content: "Generate module titles for this course." },
      ],
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as { modules: { title: string }[] };
  }

  if (section === "lessons") {
    const modules = currentBlueprint?.modules ?? [];
    const moduleTitles = modules.map((m) => m.title).join(", ");
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            basePrompt +
            `Existing modules: ${moduleTitles}. Respond with a JSON object: { "lessons": [ { "moduleIndex": 0, "title": "Lesson title" }, ... ] }. moduleIndex is 0-based. Give 2-5 lessons per module.`,
        },
        { role: "user", content: "Generate lesson titles for each module." },
      ],
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as { lessons: { moduleIndex: number; title: string }[] };
  }

  if (section === "ilos") {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            basePrompt +
            'Respond with a JSON object: { "ilos": [ "By the end of this course learners will...", ... ] }. Provide 3-6 clear learning outcomes.',
        },
        { role: "user", content: "Generate learning outcomes (ILOs)." },
      ],
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as { ilos: string[] };
  }

  if (section === "assessmentPlan") {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            basePrompt +
            'Respond with a JSON object: { "assessmentPlan": "2-5 sentence description of how and where assessment will occur (quizzes, knowledge checks, final quiz, etc.)." }',
        },
        { role: "user", content: "Generate the assessment plan." },
      ],
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as { assessmentPlan: string };
  }

  throw new Error(`Unknown section: ${section}`);
}

// --- Lesson page content generation ---

export interface LessonContentContext {
  courseTitle: string;
  overview?: string | null;
  audience?: string | null;
  tone?: string | null;
  ilos?: string[] | null;
  assessmentPlan?: string | null;
  targetWordCountPerLesson?: number | null;
}

export interface GeneratedContentBlock {
  type: "text" | "heading";
  content: { text?: string; level?: number };
}

export interface GeneratedInteractionBlock {
  type: "reflection" | "multiple_choice" | "true_false";
  config: Record<string, unknown>;
}

export interface GeneratedLessonContent {
  contentBlocks: GeneratedContentBlock[];
  interactionBlocks: GeneratedInteractionBlock[];
}

export async function generateLessonContent(
  client: OpenAI,
  lessonTitle: string,
  context: LessonContentContext
): Promise<GeneratedLessonContent> {
  const ilosText = Array.isArray(context.ilos) && context.ilos.length ? context.ilos.join("\n") : "Not specified.";
  const wordCountInstruction = context.targetWordCountPerLesson
    ? `Target word count for this lesson: approximately ${context.targetWordCountPerLesson} words. Adjust content length accordingly.`
    : "";
  const prompt = `You are an instructional designer. Generate lesson page content for this lesson in a course.
Course: ${context.courseTitle}
${context.overview ? `Overview: ${context.overview}` : ""}
${context.audience ? `Audience: ${context.audience}` : ""}
${context.tone ? `Tone: ${context.tone}` : ""}
Course learning outcomes (ILOs): ${ilosText}
${context.assessmentPlan ? `Assessment plan: ${context.assessmentPlan}` : ""}
${wordCountInstruction}

Lesson title: ${lessonTitle}

Respond with a single JSON object with this exact structure. No markdown.
{
  "contentBlocks": [
    { "type": "text", "content": { "text": "2-3 sentence intro for this lesson" } },
    { "type": "heading", "content": { "level": 2, "text": "Main topic heading" } },
    { "type": "text", "content": { "text": "Core content paragraph(s). Use \\n for new lines." } },
    { "type": "heading", "content": { "level": 3, "text": "Key takeaway or check" } },
    { "type": "text", "content": { "text": "1-2 sentence knowledge check or reflection prompt context" } },
    { "type": "heading", "content": { "level": 2, "text": "Summary" } },
    { "type": "text", "content": { "text": "2-4 sentence summary of the lesson" } }
  ],
  "interactionBlocks": [
    { "type": "reflection", "config": { "prompt": "A reflection question for the learner (1-2 sentences)" } }
  ]
}
Use "text" and "heading" only for contentBlocks. For interactionBlocks use "reflection" with "prompt", or "multiple_choice" with "question", "options" (array of strings), "correctIndex" (0-based), "explanation" (optional). Generate exactly one interaction block (reflection preferred). Keep content aligned to the lesson and ILOs.${context.targetWordCountPerLesson ? ` Aim for approximately ${context.targetWordCountPerLesson} words total in the text content.` : ""}`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You output only valid JSON. No markdown code fences, no explanation." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("Empty AI response");
  const parsed = JSON.parse(text) as GeneratedLessonContent;
  if (!Array.isArray(parsed.contentBlocks)) parsed.contentBlocks = [];
  if (!Array.isArray(parsed.interactionBlocks)) parsed.interactionBlocks = [];
  return parsed;
}
