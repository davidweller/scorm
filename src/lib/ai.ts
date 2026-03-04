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
}

export interface GeneratedInteractionsResult {
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
${wordCountInstruction}

Lesson title: ${lessonTitle}

Respond with a single JSON object with this exact structure. No markdown.
{
  "contentBlocks": [
    { "type": "text", "content": { "text": "2-3 sentence intro for this lesson" } },
    { "type": "heading", "content": { "level": 2, "text": "Main topic heading" } },
    { "type": "text", "content": { "text": "Core content paragraph(s). Use \\n for new lines." } },
    { "type": "heading", "content": { "level": 3, "text": "Key takeaway or check" } },
    { "type": "text", "content": { "text": "1-2 sentence wrap-up for this section" } },
    { "type": "heading", "content": { "level": 2, "text": "Summary" } },
    { "type": "text", "content": { "text": "2-4 sentence summary of the lesson" } }
  ]
}
Use "text" and "heading" only for contentBlocks. Keep content aligned to the lesson and ILOs.${context.targetWordCountPerLesson ? ` Aim for approximately ${context.targetWordCountPerLesson} words total in the text content.` : ""}`;

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
  return parsed;
}

// --- Interaction generation ---

export interface InteractionGenerationContext {
  lessonTitle: string;
  lessonContent: string;
  courseTitle: string;
  ilos: string[];
  assessmentPlan?: string | null;
  tone?: string | null;
}

export interface InteractionGenerationOptions {
  types: ("reflection" | "multiple_choice" | "true_false")[];
  count: number;
  includeExplanations: boolean;
}

export async function generateInteractions(
  client: OpenAI,
  context: InteractionGenerationContext,
  options: InteractionGenerationOptions
): Promise<GeneratedInteractionsResult> {
  const ilosText = context.ilos.length ? context.ilos.join("\n") : "Not specified.";
  const typesDescription = options.types
    .map((t) => {
      if (t === "reflection") return '"reflection" with "prompt" (open-ended question for learner to reflect on)';
      if (t === "multiple_choice") return '"multiple_choice" with "question", "options" (array of 4 strings), "correctIndex" (0-based)' + (options.includeExplanations ? ', "explanation"' : '');
      if (t === "true_false") return '"true_false" with "question", "correct" (boolean)' + (options.includeExplanations ? ', "explanation"' : '');
      return t;
    })
    .join("; ");

  const prompt = `You are an instructional designer creating knowledge checks and interactions for an e-learning lesson.

Course: ${context.courseTitle}
${context.tone ? `Tone: ${context.tone}` : ""}
Learning outcomes (ILOs): ${ilosText}
${context.assessmentPlan ? `Assessment plan: ${context.assessmentPlan}` : ""}

Lesson title: ${context.lessonTitle}

Lesson content:
${context.lessonContent}

Generate exactly ${options.count} interaction block(s) for this lesson. Use these types: ${typesDescription}.

Requirements:
- Questions must be directly based on the lesson content above
- Questions should help verify understanding of key concepts
- For multiple choice, ensure distractors are plausible but clearly wrong
- For true/false, avoid trick questions
- For reflections, prompt deeper thinking about application
${options.includeExplanations ? "- Include brief explanations for why answers are correct/incorrect" : ""}

Respond with a JSON object:
{
  "interactionBlocks": [
    { "type": "...", "config": { ... } }
  ]
}`;

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
  const parsed = JSON.parse(text) as GeneratedInteractionsResult;
  if (!Array.isArray(parsed.interactionBlocks)) parsed.interactionBlocks = [];
  
  const validTypes = new Set(options.types);
  parsed.interactionBlocks = parsed.interactionBlocks.filter(
    (b) => validTypes.has(b.type as "reflection" | "multiple_choice" | "true_false")
  );
  
  return parsed;
}

// --- Block regeneration ---

export interface RegenerateContentBlockContext {
  blockType: string;
  currentContent: Record<string, unknown>;
  pageContent: string;
  lessonTitle: string;
  courseTitle: string;
  tone?: string | null;
}

export async function regenerateContentBlock(
  client: OpenAI,
  context: RegenerateContentBlockContext
): Promise<{ content: Record<string, unknown> }> {
  const { blockType, currentContent, pageContent, lessonTitle, courseTitle, tone } = context;

  let typeInstruction = "";
  if (blockType === "text") {
    typeInstruction = 'Generate a "text" block with { "text": "paragraph content" }. Write 2-4 sentences that fit the lesson context.';
  } else if (blockType === "heading") {
    const level = (currentContent.level as number) || 2;
    typeInstruction = `Generate a "heading" block with { "level": ${level}, "text": "heading text" }. Create a clear, descriptive heading.`;
  } else if (blockType === "key_insight") {
    typeInstruction = 'Generate a "key_insight" block with { "text": "insight text" }. Write a memorable, impactful statement (1-2 sentences).';
  } else if (blockType === "key_point") {
    typeInstruction = 'Generate a "key_point" block with { "title": "optional title", "text": "key point content" }. Summarize an important concept.';
  } else {
    throw new Error(`Cannot regenerate block type: ${blockType}`);
  }

  const prompt = `You are an instructional designer. Regenerate a content block for an e-learning lesson.

Course: ${courseTitle}
Lesson: ${lessonTitle}
${tone ? `Tone: ${tone}` : ""}

Current page content for context:
${pageContent.slice(0, 2000)}

${typeInstruction}

Respond with a JSON object: { "content": { ... } }
The content should be fresh and different from what might already exist, while remaining relevant to the lesson.`;

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
  return JSON.parse(text) as { content: Record<string, unknown> };
}

export interface RegenerateInteractionBlockContext {
  blockType: string;
  currentConfig: Record<string, unknown>;
  pageContent: string;
  lessonTitle: string;
  courseTitle: string;
  tone?: string | null;
  includeExplanation?: boolean;
}

export async function regenerateInteractionBlock(
  client: OpenAI,
  context: RegenerateInteractionBlockContext
): Promise<{ config: Record<string, unknown> }> {
  const { blockType, pageContent, lessonTitle, courseTitle, tone, includeExplanation = true } = context;

  let typeInstruction = "";
  if (blockType === "multiple_choice") {
    typeInstruction = `Generate a "multiple_choice" interaction with:
{ "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0${includeExplanation ? ', "explanation": "..."' : ""} }
Create a question that tests understanding of the lesson content. Ensure distractors are plausible but clearly wrong.`;
  } else if (blockType === "true_false") {
    typeInstruction = `Generate a "true_false" interaction with:
{ "question": "statement to evaluate", "correct": true or false${includeExplanation ? ', "explanation": "..."' : ""} }
Create a clear statement that can be evaluated as true or false. Avoid trick questions.`;
  } else if (blockType === "reflection") {
    typeInstruction = `Generate a "reflection" interaction with:
{ "prompt": "open-ended question" }
Create a thought-provoking question that encourages learners to apply or reflect on the lesson content.`;
  } else {
    throw new Error(`Cannot regenerate interaction type: ${blockType}`);
  }

  const prompt = `You are an instructional designer. Regenerate an interaction/quiz item for an e-learning lesson.

Course: ${courseTitle}
Lesson: ${lessonTitle}
${tone ? `Tone: ${tone}` : ""}

Lesson content for context:
${pageContent.slice(0, 2000)}

${typeInstruction}

Respond with a JSON object: { "config": { ... } }
The question should be fresh and different, while testing key concepts from the lesson.`;

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
  return JSON.parse(text) as { config: Record<string, unknown> };
}
