import OpenAI from "openai";
import type { Blueprint, IntendedLearningOutcome, BlueprintModule } from "@/types";
import { getExampleCoursePromptContext } from "./example-course";

export interface BlueprintGenerateInput {
  topic: string;
  length: string;
  overview?: string;
  ilos?: string[];
  targetAudience?: string;
  tone?: string;
  level?: string;
  deliveryMode?: string;
  assessmentDescription?: string;
  optimiseIlos?: boolean;
}

function parseJsonFromResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, trimmed];
  const jsonStr = (match[1] ?? trimmed).trim();
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

export async function generateBlueprintWithAI(
  apiKey: string,
  input: BlueprintGenerateInput
): Promise<Blueprint> {
  const openai = new OpenAI({ apiKey });
  const userIlos = input.ilos?.filter(Boolean).join("\n") || "";
  const exampleContext = getExampleCoursePromptContext().trim();
  const referenceBlock =
    exampleContext.length > 0
      ? `\nUse the following reference course as your structure and style guide. Match its quality of overview, ILO phrasing, module count and title style, activity mix, and tone. Do not copy the reference topic; apply this structure to the user's topic.\n\nReference course context:\n${exampleContext}\n\n---\n\n`
      : "\n";
  const prompt = `You are an instructional designer. Generate a course blueprint as JSON.
${referenceBlock}User request:
Course topic: ${input.topic}
Total length: ${input.length}
${input.targetAudience ? `Target audience: ${input.targetAudience}` : ""}
${input.tone ? `Tone: ${input.tone}` : ""}
${input.level ? `Level: ${input.level}` : ""}
${input.deliveryMode ? `Delivery mode: ${input.deliveryMode}` : ""}
${input.overview ? `User-provided overview (use or adapt): ${input.overview}` : ""}
${userIlos ? `User-provided ILOs (${input.optimiseIlos ? "optimise and" : "preserve and"} use):\n${userIlos}` : ""}
${input.assessmentDescription ? `Assessment: ${input.assessmentDescription}` : ""}

Respond with ONLY a single JSON object (no markdown, no explanation) with this exact structure:
{
  "overview": "2-3 sentence course overview",
  "ilos": [{"id": "ilo1", "text": "ILO text"}, ...],
  "modules": [
    {"id": "mod1", "title": "Module title", "summary": "Brief summary", "timeMinutes": 15, "activityTypes": ["reflection"], "iloIds": ["ilo1"]},
    ...
  ],
  "tone": "professional",
  "level": "intermediate"
}
Use unique ids (e.g. ilo1, ilo2, mod1, mod2). Map each ILO to at least one module via iloIds. timeMinutes should sum to the course length.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);
  const ilos: IntendedLearningOutcome[] = (Array.isArray(raw.ilos) ? raw.ilos : []).map(
    (item: { id?: string; text?: string }, i: number) => ({
      id: typeof item.id === "string" ? item.id : `ilo_${i + 1}`,
      text: typeof item.text === "string" ? item.text : String(item),
    })
  );
  const modules: BlueprintModule[] = (Array.isArray(raw.modules) ? raw.modules : []).map(
    (item: Record<string, unknown>, i: number) => ({
      id: typeof item.id === "string" ? item.id : `mod_${i + 1}`,
      title: typeof item.title === "string" ? item.title : `Module ${i + 1}`,
      summary: typeof item.summary === "string" ? item.summary : undefined,
      timeMinutes: typeof item.timeMinutes === "number" ? item.timeMinutes : undefined,
      activityTypes: Array.isArray(item.activityTypes) ? item.activityTypes.map(String) : undefined,
      iloIds: Array.isArray(item.iloIds) ? item.iloIds.map(String) : undefined,
    })
  );
  return {
    overview: typeof raw.overview === "string" ? raw.overview : undefined,
    ilos,
    modules,
    tone: typeof raw.tone === "string" ? raw.tone : undefined,
    level: typeof raw.level === "string" ? raw.level : undefined,
  };
}
