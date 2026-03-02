import OpenAI from "openai";
import { getExampleCoursePromptContext, getExampleCourseExcerptsForModules } from "./example-course";
import type { Blueprint, Module } from "@/types";
import type { GeneratedModuleDraft, GeneratedModuleDraftActivity } from "./module";

function parseJsonFromResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, trimmed];
  const jsonStr = (match[1] ?? trimmed).trim();
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

export async function generateCourseDraftWithAI(
  apiKey: string,
  params: {
    topic: string;
    length: string;
    blueprint: Blueprint;
    modules: Module[];
  }
): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const exampleContext = getExampleCoursePromptContext().trim();
  const exampleExcerpts = getExampleCourseExcerptsForModules().trim();
  const modulesSummary = params.modules
    .sort((a, b) => a.order - b.order)
    .map((m, i) => `${i + 1}. ${m.title}`)
    .join("\n");
  const ilosText = params.blueprint.ilos.map((i, idx) => `${idx + 1}. ${i.text}`).join("\n");

  const prompt = `You are an instructional designer. Write a full course draft in continuous text (like a workshop handout), based on the structure and style of the reference course.

Reference course context:
${exampleContext}

Example module excerpts:
${exampleExcerpts}

---

New course request:
Topic: ${params.topic}
Length: ${params.length}
Intended learning outcomes:
${ilosText}

Modules (in order):
${modulesSummary}

Respond with ONLY this JSON:
{ "draft": "Full course text here..." }

Rules:
- Use the module titles as H2-style headings in the text.
- Within each module, follow a W1-style flow: introduction, explanation, scenarios, activities described in prose, reflections, and key takeaways.
- Do NOT break content into sections or JSON arrays; this is a single long draft string, but you may include headings and subheadings in the text.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);
  const draft = typeof raw.draft === "string" ? raw.draft : content;
  return draft;
}

export async function breakdownCourseDraftWithAI(
  apiKey: string,
  params: {
    topic: string;
    draft: string;
    modules: Module[];
  }
): Promise<{ moduleDrafts: { moduleId: string; draft: GeneratedModuleDraft }[] }> {
  const openai = new OpenAI({ apiKey });
  const exampleExcerpts = getExampleCourseExcerptsForModules().trim();
  const modulesSpec = params.modules
    .sort((a, b) => a.order - b.order)
    .map((m, i) => ({ index: i, id: m.id, title: m.title }));
  const modulesText = modulesSpec.map((m) => `${m.index}: ${m.title}`).join("\n");

  const prompt = `You are an instructional designer. You are given a full course draft and a list of module titles. Break the draft into modules, then into sections and inline activities, using a W1-style structure.

Example module/section style:
${exampleExcerpts}

---

Course topic: ${params.topic}

Modules (by index):
${modulesText}

Full course draft:
"""${params.draft}"""

Respond with ONLY this JSON:
{
  "modules": [
    {
      "moduleIndex": 0,
      "sections": [
        { "heading": "...", "content": "...", "scenario": "... (optional)", "reflectionPrompt": "...", "knowledgeChecks": ["...", "..."], "resourceSuggestions": ["..."] }
      ],
      "activities": [
        { "type": "multiple_choice" | "flashcards", "title": "Optional label", "placeAfterSectionIndex": 0 }
      ]
    }
  ]
}

Rules:
- Preserve the module order using moduleIndex from the list above.
- Each module must have 3–6 sections, first section an Introduction.
- Use placeAfterSectionIndex (0-based) to indicate where activities should appear within the module sections.
- Limit activity types to multiple_choice and flashcards.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const raw = parseJsonFromResponse(content);
  const modulesRaw = Array.isArray(raw.modules) ? raw.modules : [];

  const moduleDrafts = modulesRaw.flatMap((m: Record<string, unknown>) => {
    const idx = typeof m.moduleIndex === "number" ? Math.floor(m.moduleIndex) : -1;
    if (idx < 0 || idx >= modulesSpec.length) return [];
    const spec = modulesSpec[idx];
    const sectionsRaw = Array.isArray(m.sections) ? m.sections : [];
    const activitiesRaw = Array.isArray(m.activities) ? m.activities : [];

    const sections: GeneratedModuleDraft["sections"] = sectionsRaw.map(
      (s: Record<string, unknown>, i: number) => ({
        id: crypto.randomUUID(),
        heading: typeof s.heading === "string" ? s.heading : `Section ${i + 1}`,
        content: typeof s.content === "string" ? s.content : "",
        scenario: typeof s.scenario === "string" ? s.scenario : undefined,
        reflectionPrompt: typeof s.reflectionPrompt === "string" ? s.reflectionPrompt : undefined,
        knowledgeChecks: Array.isArray(s.knowledgeChecks) ? s.knowledgeChecks.map(String) : [],
        resourceSuggestions: Array.isArray(s.resourceSuggestions) ? s.resourceSuggestions.map(String) : undefined,
        activityIds: [],
      })
    );

    const activities: GeneratedModuleDraftActivity[] = activitiesRaw.flatMap(
      (a: Record<string, unknown>) => {
        const type = String(a.type) as GeneratedModuleDraftActivity["type"];
        if (type !== "multiple_choice" && type !== "flashcards") return [];
        const rawIdx = typeof a.placeAfterSectionIndex === "number" ? Math.floor(a.placeAfterSectionIndex) : 0;
        const placeAfterSectionIndex = Number.isFinite(rawIdx) ? rawIdx : 0;
        return [
          {
            type,
            title: typeof a.title === "string" ? a.title : undefined,
            placeAfterSectionIndex,
          },
        ];
      }
    );

    const draft: GeneratedModuleDraft = { sections, activities };
    return [{ moduleId: spec.id, draft }];
  });

  return { moduleDrafts };
}

