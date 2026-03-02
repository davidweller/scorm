import OpenAI from "openai";
import type { ModuleSection } from "@/types";
import { getExampleCourseExcerptsForModules } from "./example-course";

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
  const openai = new OpenAI({ apiKey });
  const exampleExcerpts = getExampleCourseExcerptsForModules().trim();
  const referenceBlock =
    exampleExcerpts.length > 0
      ? `\nMatch the structure and style of this reference course: clear Introduction, then content parts with headings, optional scenario, reflection prompts, and knowledge checks. Use a professional, direct tone and concrete examples where appropriate.\n\n${exampleExcerpts}\n\n---\n\n`
      : "\n";
  const prompt = `You are an instructional designer. Generate module content as JSON.
${referenceBlock}Course topic: ${params.courseTopic}
Module title: ${params.moduleTitle}
${params.courseOverview ? `Course overview: ${params.courseOverview}` : ""}

Respond with ONLY a single JSON object: { "sections": [ { "heading": "...", "content": "...", "scenario": "... (optional)", "reflectionPrompt": "...", "knowledgeChecks": ["...", "..."], "resourceSuggestions": ["..."] }, ... ] }
Create 3-4 sections. First section should be an Introduction. content and scenario can be 1-3 sentences. reflectionPrompt one sentence. knowledgeChecks 1-3 short questions.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  return sections.map((s: Record<string, unknown>, i: number) => ({
    id: crypto.randomUUID(),
    heading: typeof s.heading === "string" ? s.heading : `Section ${i + 1}`,
    content: typeof s.content === "string" ? s.content : "",
    scenario: typeof s.scenario === "string" ? s.scenario : undefined,
    reflectionPrompt: typeof s.reflectionPrompt === "string" ? s.reflectionPrompt : undefined,
    knowledgeChecks: Array.isArray(s.knowledgeChecks) ? s.knowledgeChecks.map(String) : [],
    resourceSuggestions: Array.isArray(s.resourceSuggestions) ? s.resourceSuggestions.map(String) : undefined,
  })) as ModuleSection[];
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
