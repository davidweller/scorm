/**
 * AI-powered course import from DOCX documents.
 * Uses OpenAI to analyze document content and extract course structure.
 */

import OpenAI from "openai";
import type {
  ContentBlockType,
  InteractionBlockType,
  MultipleChoiceConfig,
  TrueFalseConfig,
  ReflectionConfig,
  DragAndDropConfig,
  MatchingConfig,
  DialogCardsConfig,
} from "@/types/course";

const IMPORT_MODEL = process.env.OPENAI_IMPORT_MODEL || "gpt-5.2";

export interface ImportedBlock {
  category: "content" | "interaction";
  type: ContentBlockType | InteractionBlockType;
  data: Record<string, unknown>;
}

export interface ImportedPage {
  title: string;
  blocks: ImportedBlock[];
}

export interface ImportedLesson {
  title: string;
  pages: ImportedPage[];
}

export interface ImportedModule {
  title: string;
  lessons: ImportedLesson[];
}

export interface ImportedCourseData {
  title: string;
  overview: string;
  audience?: string;
  tone?: string;
  ilos: string[];
  assessmentPlan?: string;
  modules: ImportedModule[];
}

const SYSTEM_PROMPT = `You are an expert instructional designer. Analyze a course document and extract the complete course structure as JSON.

DOCUMENT STRUCTURE:
- Content BEFORE "Module 1" contains metadata AND learner-facing introduction content (course overview, how to use the course, prerequisites, etc.).
- Course content starts at "Module 1" (or "# Module 1"), but you MUST NOT omit the pre-Module content.
- Each "Module X" heading marks a new module
- All content within a module goes on a SINGLE page

REQUIRED OUTPUT FORMAT:
{
  "title": "Course title from document",
  "overview": "2-4 sentence course description",
  "audience": "Target audience if mentioned",
  "tone": "formal|conversational|technical|friendly",
  "ilos": ["Learning outcome 1", "Learning outcome 2", ...],
  "assessmentPlan": "Assessment approach if mentioned",
  "modules": [
    {
      "title": "Module 1 - Title Here",
      "lessons": [{
        "title": "Module 1 - Title Here",
        "pages": [{
          "title": "Module 1 - Title Here",
          "blocks": [
            { "category": "content", "type": "text", "data": { "text": "<p>First paragraph of actual content...</p>" } },
            { "category": "content", "type": "heading", "data": { "level": 2, "text": "Section Heading" } },
            { "category": "content", "type": "text", "data": { "text": "<p>More paragraph content...</p>" } }
          ]
        }]
      }]
    }
  ]
}

CONTENT BLOCK TYPES - CRITICAL: Every paragraph becomes a "text" block with category "content":
- "text": { "text": "<p>The actual paragraph text goes here</p>" } - USE FOR ALL PARAGRAPHS
- "text": { "text": "<ul><li>Item 1</li><li>Item 2</li></ul>" } - USE FOR BULLET LISTS
- "text": { "text": "<ol><li>Step 1</li><li>Step 2</li></ol>" } - USE FOR NUMBERED LISTS
- "heading": { "level": 2, "text": "Heading text" } - USE FOR H2/## HEADINGS
- "heading": { "level": 3, "text": "Subheading text" } - USE FOR H3/### HEADINGS
- "image": { "url": "https://...", "alt": "description" } - USE FOR IMAGES (see marker rule below)
- "key_insight": { "text": "<p>Important insight text</p>" }
- "key_point": { "title": "optional title", "text": "<p>Point content</p>" }
- "table": { "html": "<table>...</table>" }

INTERACTION BLOCK TYPES (for quizzes/questions):
- "multiple_choice": { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }
- "true_false": { "question": "...", "correct": true|false, "explanation": "..." }
- "reflection": { "prompt": "..." }
- "drag_and_drop": { "question": "...", "items": [...], "correctOrder": [...], "explanation": "..." }
- "matching": { "question": "...", "pairs": [{"left":"...","right":"..."}], "explanation": "..." }
- "dialog_cards": { "title": "...", "cards": [{"front":"...","back":"..."}] }

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. EVERY paragraph of text MUST become a block: { "category": "content", "type": "text", "data": { "text": "<p>actual paragraph content here</p>" } }
2. DO NOT skip or summarize - include the FULL TEXT of every single paragraph from the document
3. Each module = 1 lesson = 1 page (flat structure)
4. H2 headings (##) become: { "category": "content", "type": "heading", "data": { "level": 2, "text": "heading text" } }
5. H3 headings (###) become: { "category": "content", "type": "heading", "data": { "level": 3, "text": "heading text" } }
6. Bullet lists become: { "category": "content", "type": "text", "data": { "text": "<ul><li>item</li></ul>" } }
7. Numbered lists become: { "category": "content", "type": "text", "data": { "text": "<ol><li>item</li></ol>" } }
8. Keep content in document order
9. Look for quiz patterns: "Quiz:", "Question:", "True or False:", "Match:", "Flashcards:" - when you convert these to interaction blocks, DO NOT also create text blocks for the same content. The interaction block REPLACES the text, not duplicates it.
10. Preserve formatting: <strong> for bold, <em> for italic
11. IMAGE MARKERS: If the document contains markers in this exact form: [[IMAGE url="..." alt="..."]]
    - You MUST create a separate image block at that exact position:
      { "category": "content", "type": "image", "data": { "url": "<url>", "alt": "<alt>" } }
    - If url is empty, still create the image block (so the user can fix it later).
    - Do NOT wrap the marker in a text block; the image block replaces the marker.
12. INTRODUCTION CONTENT: ALL content before \"Module 1\" must be included as an \"Introduction\" module BEFORE Module 1:
    {
      \"title\": \"Introduction\",
      \"lessons\": [{
        \"title\": \"Introduction\",
        \"pages\": [{
          \"title\": \"Introduction\",
          \"blocks\": [ ... all pre-Module content converted into blocks in order ... ]
        }]
      }]
    }
    - Include Course Overview and any other pre-Module text here as blocks (do not omit it).
    - Still also populate the top-level JSON fields: title, overview, audience, tone, ilos, assessmentPlan.
    - IMPORTANT: Even if you extract Course Overview into the top-level \"overview\" field, you MUST ALSO include that same overview text as blocks in the Introduction page.
13. A module with substantial content should have 20-100+ blocks. If you only have a few blocks, you're missing content!`;

export async function analyzeCourseDocument(
  client: OpenAI,
  documentContent: string
): Promise<ImportedCourseData> {
  console.log(`[Import] Analyzing document (${documentContent.length} chars) with model: ${IMPORT_MODEL}`);
  console.log(`[Import] Starting API call at ${new Date().toISOString()}...`);
  
  const startTime = Date.now();
  
  // Determine token parameter based on model - newer models use max_completion_tokens
  const isGpt5Model = IMPORT_MODEL.startsWith("gpt-5");
  const tokenParams = isGpt5Model 
    ? { max_completion_tokens: 65536 }
    : { max_tokens: 16384 };
  
  const response = await client.chat.completions.create({
    model: IMPORT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `Analyze this course document and extract the complete structure as JSON:\n\n${documentContent}` 
      },
    ],
    response_format: { type: "json_object" },
    ...tokenParams,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Import] API call completed in ${elapsed}s`);

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty AI response when analyzing document");
  }

  console.log(`[Import] Received response (${text.length} chars), finish_reason: ${response.choices[0]?.finish_reason}`);

  try {
    const parsed = JSON.parse(text) as ImportedCourseData;
    const result = validateAndNormalizeImportedCourse(parsed);
    
    const counts = countImportedContent(result);
    console.log(`[Import] Extracted: ${counts.modules} modules, ${counts.lessons} lessons, ${counts.pages} pages, ${counts.contentBlocks} content blocks, ${counts.interactions} interactions`);
    
    return result;
  } catch (e) {
    const parseError = e instanceof Error ? e.message : "Unknown parse error";
    throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
  }
}

function validateAndNormalizeImportedCourse(data: ImportedCourseData): ImportedCourseData {
  if (!data.title || typeof data.title !== "string") {
    data.title = "Imported Course";
  }

  if (!data.overview || typeof data.overview !== "string") {
    data.overview = "";
  }

  if (!Array.isArray(data.ilos)) {
    data.ilos = [];
  }

  if (!Array.isArray(data.modules)) {
    data.modules = [];
  }

  for (const mod of data.modules) {
    if (!mod.title) mod.title = "Untitled Module";
    if (!Array.isArray(mod.lessons)) mod.lessons = [];

    for (const lesson of mod.lessons) {
      if (!lesson.title) lesson.title = "Untitled Lesson";
      if (!Array.isArray(lesson.pages)) lesson.pages = [];

      for (const page of lesson.pages) {
        if (!page.title) page.title = "Untitled Page";
        if (!Array.isArray(page.blocks)) page.blocks = [];

        const originalCount = page.blocks.length;
        // Deterministically convert any [[IMAGE ...]] markers that slipped into text blocks
        // into separate image blocks. This avoids relying on the model to always create
        // proper image blocks from markers.
        page.blocks = expandImageMarkersInBlocks(page.blocks);

        // Now validate/filter blocks (after expansion) so image blocks are retained.
        page.blocks = page.blocks.filter((block) => {
          if (!block.category || !block.type || !block.data) {
            console.log(`[Import] Filtering block - missing fields:`, { category: block.category, type: block.type, hasData: !!block.data });
            return false;
          }
          const valid = validateBlock(block);
          if (!valid) {
            console.log(`[Import] Filtering invalid block:`, { category: block.category, type: block.type });
          }
          return valid;
        });

        if (page.blocks.length !== originalCount) {
          console.log(`[Import] Filtered ${originalCount - page.blocks.length} blocks from page "${page.title}"`);
        }
      }
    }
  }

  return data;
}

function expandImageMarkersInBlocks(blocks: ImportedBlock[]): ImportedBlock[] {
  const out: ImportedBlock[] = [];
  const markerRegex = /\[\[IMAGE url="([^"]*)" alt="([^"]*)"\]\]/g;

  for (const block of blocks) {
    if (block.category !== "content" || block.type !== "text") {
      out.push(block);
      continue;
    }
    const data = block.data as { text?: unknown };
    const text = typeof data?.text === "string" ? data.text : "";
    if (!text || !markerRegex.test(text)) {
      out.push(block);
      continue;
    }

    markerRegex.lastIndex = 0;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = markerRegex.exec(text)) !== null) {
      const before = text.slice(lastIndex, m.index);
      const url = m[1] || "";
      const alt = (m[2] || "").replaceAll("&quot;", "\"");

      if (before.trim()) {
        out.push({
          category: "content",
          type: "text",
          data: { text: before },
        });
      }

      out.push({
        category: "content",
        type: "image",
        data: { url, alt },
      });

      lastIndex = m.index + m[0].length;
    }

    const after = text.slice(lastIndex);
    if (after.trim()) {
      out.push({
        category: "content",
        type: "text",
        data: { text: after },
      });
    }
  }

  return out;
}

const VALID_CONTENT_TYPES = new Set([
  "text",
  "heading",
  "image",
  "video_embed",
  "key_insight",
  "key_point",
  "table",
]);
const VALID_INTERACTION_TYPES = new Set(["multiple_choice", "true_false", "reflection", "drag_and_drop", "matching", "dialog_cards"]);

function validateBlock(block: ImportedBlock): boolean {
  if (block.category === "content") {
    if (!VALID_CONTENT_TYPES.has(block.type)) return false;
    if (block.type === "image") {
      const data = block.data as { url?: unknown; alt?: unknown };
      // url may be empty string for placeholders, a data: URL, or an https URL.
      if (typeof data.url !== "string") return false;
      if (data.alt != null && typeof data.alt !== "string") return false;
      return true;
    }
    if (block.type === "table") {
      const data = block.data as { html?: string };
      return typeof data.html === "string" && data.html.length > 0;
    }
    return true;
  }
  if (block.category === "interaction") {
    if (!VALID_INTERACTION_TYPES.has(block.type)) return false;
    return validateInteractionData(block.type as InteractionBlockType, block.data);
  }
  return false;
}

function validateInteractionData(type: InteractionBlockType, data: Record<string, unknown>): boolean {
  switch (type) {
    case "multiple_choice": {
      const mc = data as Partial<MultipleChoiceConfig>;
      return (
        typeof mc.question === "string" &&
        Array.isArray(mc.options) &&
        mc.options.length >= 2 &&
        typeof mc.correctIndex === "number" &&
        mc.correctIndex >= 0 &&
        mc.correctIndex < mc.options.length
      );
    }
    case "true_false": {
      const tf = data as Partial<TrueFalseConfig>;
      return typeof tf.question === "string" && typeof tf.correct === "boolean";
    }
    case "reflection": {
      const r = data as Partial<ReflectionConfig>;
      return typeof r.prompt === "string";
    }
    case "drag_and_drop": {
      const dd = data as Partial<DragAndDropConfig>;
      return (
        typeof dd.question === "string" &&
        Array.isArray(dd.items) &&
        dd.items.length >= 2 &&
        Array.isArray(dd.correctOrder) &&
        dd.correctOrder.length === dd.items.length
      );
    }
    case "matching": {
      const m = data as Partial<MatchingConfig>;
      return (
        typeof m.question === "string" &&
        Array.isArray(m.pairs) &&
        m.pairs.length >= 2 &&
        m.pairs.every((p) => typeof p.left === "string" && typeof p.right === "string")
      );
    }
    case "dialog_cards": {
      const dc = data as Partial<DialogCardsConfig>;
      return (
        Array.isArray(dc.cards) &&
        dc.cards.length >= 1 &&
        dc.cards.every((c) => typeof c.front === "string" && typeof c.back === "string")
      );
    }
    default:
      return false;
  }
}

export function countImportedContent(data: ImportedCourseData): {
  modules: number;
  lessons: number;
  pages: number;
  contentBlocks: number;
  interactions: number;
} {
  let lessons = 0;
  let pages = 0;
  let contentBlocks = 0;
  let interactions = 0;

  for (const mod of data.modules) {
    lessons += mod.lessons.length;
    for (const lesson of mod.lessons) {
      pages += lesson.pages.length;
      for (const page of lesson.pages) {
        for (const block of page.blocks) {
          if (block.category === "content") contentBlocks++;
          else if (block.category === "interaction") interactions++;
        }
      }
    }
  }

  return {
    modules: data.modules.length,
    lessons,
    pages,
    contentBlocks,
    interactions,
  };
}
