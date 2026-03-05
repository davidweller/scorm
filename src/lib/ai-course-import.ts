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

const SYSTEM_PROMPT = `You are an expert instructional designer and course analyst. Your task is to analyze a Word document and extract a complete e-learning course structure.

You must return a JSON object with the following structure:

{
  "title": "Course title extracted from document",
  "overview": "2-4 sentence course description/overview",
  "audience": "Target audience if mentioned (e.g., 'corporate professionals', 'undergraduate students')",
  "tone": "One of: formal, conversational, technical, friendly - based on document style",
  "ilos": ["Learning outcome 1", "Learning outcome 2", ...],
  "assessmentPlan": "Brief description of assessment approach if mentioned",
  "modules": [
    {
      "title": "Module 1 title",
      "lessons": [
        {
          "title": "Lesson 1.1 title",
          "pages": [
            {
              "title": "Page title",
              "blocks": [
                { "category": "content", "type": "heading", "data": { "level": 2, "text": "Heading text" } },
                { "category": "content", "type": "text", "data": { "text": "<p>Paragraph content...</p>" } },
                { "category": "content", "type": "key_insight", "data": { "text": "<p>Important insight...</p>" } },
                { "category": "content", "type": "key_point", "data": { "title": "Key Point", "text": "<p>Point content...</p>" } },
                { "category": "interaction", "type": "multiple_choice", "data": { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." } },
                { "category": "interaction", "type": "true_false", "data": { "question": "...", "correct": true, "explanation": "..." } },
                { "category": "interaction", "type": "reflection", "data": { "prompt": "..." } },
                { "category": "interaction", "type": "drag_and_drop", "data": { "question": "...", "items": [...], "correctOrder": [...], "explanation": "..." } },
                { "category": "interaction", "type": "matching", "data": { "question": "...", "pairs": [{"left": "...", "right": "..."}], "explanation": "..." } },
                { "category": "interaction", "type": "dialog_cards", "data": { "title": "...", "cards": [{"front": "...", "back": "..."}] } }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Content block types (IMPORTANT: text fields support HTML formatting):
- "text": { "text": "<p>HTML formatted content</p><ul><li>List item</li></ul>" }
- "heading": { "level": 1|2|3, "text": "heading text (plain text, no HTML)" }
- "key_insight": { "text": "<p>HTML formatted insight</p>" }
- "key_point": { "title": "optional title (plain text)", "text": "<p>HTML formatted content</p>" }

CRITICAL - HTML Formatting Rules for text fields:
- Wrap paragraphs in <p>...</p> tags
- Use <ul><li>...</li></ul> for bullet lists
- Use <ol><li>...</li></ol> for numbered lists  
- Use <strong>...</strong> for bold text
- Use <em>...</em> for italic text
- Preserve ALL formatting from the source document
- Multiple paragraphs should each be wrapped in their own <p> tags

Interaction block types:
- "multiple_choice": { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }
- "true_false": { "question": "statement", "correct": true|false, "explanation": "..." }
- "reflection": { "prompt": "open-ended question" }
- "drag_and_drop": { "question": "...", "items": ["item1","item2",...], "correctOrder": [0,1,2,...], "explanation": "..." }
- "matching": { "question": "...", "pairs": [{"left":"term","right":"definition"},...], "explanation": "..." }
- "dialog_cards": { "title": "optional", "cards": [{"front":"prompt","back":"answer"},...] }

Guidelines:
1. Extract the course title from the document's main heading or title
2. SIMPLE STRUCTURE: Create one module per H1 heading. Each module has one lesson. Each lesson has one page.
3. CRITICAL: Everything between one H1 heading and the next H1 heading = ONE page. All the H2s, H3s, paragraphs, quizzes - everything goes on that single page as blocks.
4. Structure for each H1 section:
   - Module title = the H1 text
   - Lesson title = same as module title
   - Page title = same as module title  
   - Page blocks = ALL content from that H1 section (can be 50, 100+ blocks - that's fine)
5. For blocks within a page:
   - H2 headings become { category: "content", type: "heading", data: { level: 2, text: "..." } }
   - H3 headings become { category: "content", type: "heading", data: { level: 3, text: "..." } }
   - Paragraphs become { category: "content", type: "text", data: { text: "<p>...</p>" } }
   - Bullet lists become { category: "content", type: "text", data: { text: "<ul><li>...</li></ul>" } }
   - Keep all content in document order
6. Convert quiz questions, assessments, and knowledge checks into appropriate interaction types
7. Look for patterns like "Quiz:", "Question:", "True or False:", "Match the following:", "Flashcards:", "Drag and Drop:" to identify interactions
8. Extract learning outcomes/objectives if present (often in bullet lists near the beginning)
9. Preserve ALL of the document's content - do not summarize or skip any text
10. Include explanations for quiz questions when the document provides answer rationales
11. PRESERVE ALL FORMATTING: Bold, italic, lists from the source document must appear in the HTML output`;

export async function analyzeCourseDocument(
  client: OpenAI,
  documentContent: string
): Promise<ImportedCourseData> {
  const userPrompt = `Analyze this course document and extract the complete course structure:

${documentContent}

Return a complete JSON object with the course structure. Be thorough - extract ALL content, quizzes, and interactions from the document.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 16000,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty AI response when analyzing document");
  }

  const parsed = JSON.parse(text) as ImportedCourseData;
  return validateAndNormalizeImportedCourse(parsed);
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

        page.blocks = page.blocks.filter((block) => {
          if (!block.category || !block.type || !block.data) return false;
          return validateBlock(block);
        });
      }
    }
  }

  return data;
}

const VALID_CONTENT_TYPES = new Set(["text", "heading", "image", "video_embed", "key_insight", "key_point"]);
const VALID_INTERACTION_TYPES = new Set(["multiple_choice", "true_false", "reflection", "drag_and_drop", "matching", "dialog_cards"]);

function validateBlock(block: ImportedBlock): boolean {
  if (block.category === "content") {
    return VALID_CONTENT_TYPES.has(block.type);
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
