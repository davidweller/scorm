import OpenAI from "openai";
import type { ModuleSection } from "@/types";
import { getExampleCourseExcerptsForModules } from "./example-course";
import type { H5PActivityType } from "@/types";

export interface GeneratedModuleDraftActivity {
  type: H5PActivityType;
  title?: string;
  /**
   * Place the activity inline after this section index (0-based).
   * Example: 0 means after the first section.
   */
  placeAfterSectionIndex: number;
}

export interface GeneratedModuleDraft {
  sections: ModuleSection[];
  activities: GeneratedModuleDraftActivity[];
}

function parseJsonFromResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, trimmed];
  const jsonStr = (match[1] ?? trimmed).trim();
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

export async function generateModuleContentWithAI(
  apiKey: string,
  params: {
    courseTopic: string;
    moduleTitle: string;
    courseOverview?: string;
  }
): Promise<ModuleSection[]> {
  const draft = await generateModuleDraftWithAI(apiKey, params);
  return draft.sections;
}

export async function generateSingleSectionWithAI(
  apiKey: string,
  params: {
    courseTopic: string;
    moduleTitle: string;
    sectionIndex: number;
    existingHeadings?: string[];
    courseOverview?: string;
  }
): Promise<ModuleSection> {
  const openai = new OpenAI({ apiKey });
  const context = params.existingHeadings?.length
    ? `Existing section headings in this module: ${params.existingHeadings.join(", ")}. Generate content for the section at index ${params.sectionIndex}.`
    : `Generate content for section ${params.sectionIndex + 1} (zero-based index ${params.sectionIndex}).`;
  const exampleExcerpts = getExampleCourseExcerptsForModules().trim();
  const referenceBlock =
    exampleExcerpts.length > 0
      ? `\nMatch the reference course style: professional, direct tone; concrete examples; clear heading; content 2-4 sentences; optional scenario; one reflection prompt; 1-3 knowledge checks.\n\n${exampleExcerpts}\n\n---\n\n`
      : "\n";
  const prompt = `You are an instructional designer. Generate ONE module section as JSON.
${referenceBlock}Course topic: ${params.courseTopic}
Module title: ${params.moduleTitle}
${params.courseOverview ? `Course overview: ${params.courseOverview}` : ""}
${context}

Respond with ONLY a single JSON object (one section): { "heading": "...", "content": "...", "scenario": "... (optional)", "reflectionPrompt": "...", "knowledgeChecks": ["...", "..."], "resourceSuggestions": ["..."] }
content: 2-4 sentences. scenario optional. reflectionPrompt one sentence. knowledgeChecks 1-3 short questions.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const s = parseJsonFromResponse(content) as Record<string, unknown>;
  return {
    id: crypto.randomUUID(),
    heading: typeof s.heading === "string" ? s.heading : `Section ${params.sectionIndex + 1}`,
    content: typeof s.content === "string" ? s.content : "",
    scenario: typeof s.scenario === "string" ? s.scenario : undefined,
    reflectionPrompt: typeof s.reflectionPrompt === "string" ? s.reflectionPrompt : undefined,
    knowledgeChecks: Array.isArray(s.knowledgeChecks) ? s.knowledgeChecks.map(String) : [],
    resourceSuggestions: Array.isArray(s.resourceSuggestions) ? s.resourceSuggestions.map(String) : undefined,
  } as ModuleSection;
}

export async function generateModuleDraftWithAI(
  apiKey: string,
  params: {
    courseTopic: string;
    moduleTitle: string;
    courseOverview?: string;
  }
): Promise<GeneratedModuleDraft> {
  const openai = new OpenAI({ apiKey });
  const exampleExcerpts = getExampleCourseExcerptsForModules().trim();
  const referenceBlock =
    exampleExcerpts.length > 0
      ? `\nMatch the structure and style of this reference course: clear Introduction, then content parts with headings, optional scenario, reflection prompts, and knowledge checks. Write in a W1-style flow and include activity writeups in the section content where appropriate (e.g. \"Activity: ...\" with brief instructions).\n\n${exampleExcerpts}\n\n---\n\n`
      : "\n";
  const prompt = `You are an instructional designer. Generate a full module draft as JSON.

${referenceBlock}Course topic: ${params.courseTopic}
Module title: ${params.moduleTitle}
${params.courseOverview ? `Course overview: ${params.courseOverview}` : ""}

Respond with ONLY a single JSON object with this exact structure:
{
  "sections": [
    {
      "heading": "...",
      "content": "...",
      "scenario": "... (optional)",
      "reflectionPrompt": "...",
      "knowledgeChecks": ["...", "..."],
      "resourceSuggestions": ["..."]
    }
  ],
  "activities": [
    { "type": "multiple_choice" | "flashcards", "title": "Optional short label", "placeAfterSectionIndex": 0 }
  ]
}

Rules:
- Create 3-6 sections. First section must be an Introduction.
- content can be multi-paragraph (use newlines). Keep each paragraph concise.
- Include at least 1 activity placeholder in the \"activities\" array and place it logically in the flow.
- placeAfterSectionIndex is 0-based and must be within the sections list range.
- Keep activity types limited to multiple_choice and flashcards.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);

  const sectionsRaw = Array.isArray(raw.sections) ? raw.sections : [];
  const sections: ModuleSection[] = sectionsRaw.map((s: Record<string, unknown>, i: number) => ({
    id: crypto.randomUUID(),
    heading: typeof s.heading === "string" ? s.heading : `Section ${i + 1}`,
    content: typeof s.content === "string" ? s.content : "",
    scenario: typeof s.scenario === "string" ? s.scenario : undefined,
    reflectionPrompt: typeof s.reflectionPrompt === "string" ? s.reflectionPrompt : undefined,
    knowledgeChecks: Array.isArray(s.knowledgeChecks) ? s.knowledgeChecks.map(String) : [],
    resourceSuggestions: Array.isArray(s.resourceSuggestions) ? s.resourceSuggestions.map(String) : undefined,
    activityIds: [],
  }));

  const activitiesRaw = Array.isArray(raw.activities) ? raw.activities : [];
  const activities: GeneratedModuleDraftActivity[] = activitiesRaw.flatMap((a: Record<string, unknown>) => {
    const type = String(a.type) as H5PActivityType;
    if (type !== "multiple_choice" && type !== "flashcards") return [];
    const idx = typeof a.placeAfterSectionIndex === "number" ? Math.floor(a.placeAfterSectionIndex) : 0;
    return [
      {
        type,
        title: typeof a.title === "string" ? a.title : undefined,
        placeAfterSectionIndex: Number.isFinite(idx) ? idx : 0,
      } satisfies GeneratedModuleDraftActivity,
    ];
  });

  return { sections, activities };
}
