import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOpenAIClient, generateInteractions } from "@/lib/ai";
import type { InteractionBlockType } from "@/types/course";

export interface GenerateInteractionsOptions {
  types: InteractionBlockType[];
  count: number;
  includeExplanations: boolean;
}

export async function generateInteractionsForLesson(
  courseId: string,
  lessonId: string,
  options: GenerateInteractionsOptions
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      tone: true,
      ilos: true,
      assessmentPlan: true,
      settings: true,
    },
  });
  if (!course) return { success: false, error: "Course not found" };

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: {
      id: true,
      title: true,
      pages: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          contentBlocks: {
            orderBy: { order: "asc" },
            select: { type: true, content: true },
          },
        },
      },
    },
  });
  if (!lesson) return { success: false, error: "Lesson not found" };

  const firstPage = lesson.pages[0];
  if (!firstPage) return { success: false, error: "Lesson has no pages" };

  const lessonContent = firstPage.contentBlocks
    .map((block) => {
      const content = block.content as Record<string, unknown>;
      if (block.type === "text" && typeof content.text === "string") {
        return content.text;
      }
      if (block.type === "heading" && typeof content.text === "string") {
        return `## ${content.text}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");

  if (!lessonContent.trim()) {
    return { success: false, error: "Lesson has no text content to base interactions on" };
  }

  const settings = course.settings as { apiKeys?: { openai?: string } } | null;
  const apiKey = settings?.apiKeys?.openai ?? null;
  const client = getOpenAIClient(apiKey);
  if (!client) {
    return {
      success: false,
      error: "No OpenAI API key. Add OPENAI_API_KEY in .env or use Bring your own key in course settings.",
    };
  }

  const ilos = Array.isArray(course.ilos)
    ? (course.ilos as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const context = {
    lessonTitle: lesson.title,
    lessonContent,
    courseTitle: course.title,
    ilos,
    assessmentPlan: typeof course.assessmentPlan === "string" ? course.assessmentPlan : null,
    tone: course.tone,
  };

  let generated: Awaited<ReturnType<typeof generateInteractions>>;
  try {
    generated = await generateInteractions(client, context, {
      types: options.types as (
        | "reflection"
        | "multiple_choice"
        | "true_false"
        | "drag_and_drop"
        | "matching"
        | "dialog_cards"
      )[],
      count: options.count,
      includeExplanations: options.includeExplanations,
    });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "AI generation failed" };
  }

  const existingCount = await prisma.interactionBlock.count({
    where: { pageId: firstPage.id },
  });

  const validTypes = [
    "reflection",
    "multiple_choice",
    "true_false",
    "drag_and_drop",
    "matching",
    "dialog_cards",
  ];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < generated.interactionBlocks.length; i++) {
      const b = generated.interactionBlocks[i];
      if (!validTypes.includes(b.type)) continue;
      await tx.interactionBlock.create({
        data: {
          pageId: firstPage.id,
          type: b.type,
          config: (b.config ?? {}) as Prisma.InputJsonValue,
          order: existingCount + i,
        },
      });
    }
  });

  return { success: true, count: generated.interactionBlocks.length };
}
