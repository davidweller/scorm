import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOpenAIClient, generateLessonContent } from "@/lib/ai";

export async function generatePagesForLesson(courseId: string, lessonId: string): Promise<{ success: true; pageId: string } | { success: false; error: string }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      overview: true,
      audience: true,
      tone: true,
      ilos: true,
      assessmentPlan: true,
      settings: true,
      targetWordCount: true,
    },
  });
  if (!course) return { success: false, error: "Course not found" };

  let targetWordCountPerLesson: number | undefined;
  if (course.targetWordCount) {
    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId } },
    });
    if (totalLessons > 0) {
      targetWordCountPerLesson = Math.round(course.targetWordCount / totalLessons);
    }
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true, title: true },
  });
  if (!lesson) return { success: false, error: "Lesson not found" };

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
    : undefined;
  const context = {
    courseTitle: course.title,
    overview: course.overview,
    audience: course.audience,
    tone: course.tone,
    ilos,
    assessmentPlan:
      typeof course.assessmentPlan === "string" ? course.assessmentPlan : undefined,
    targetWordCountPerLesson,
  };
  let generated: Awaited<ReturnType<typeof generateLessonContent>>;
  try {
    generated = await generateLessonContent(client, lesson.title, context);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "AI generation failed" };
  }

  let page = await prisma.page.findFirst({
    where: { lessonId },
    orderBy: { order: "asc" },
  });
  if (!page) {
    page = await prisma.page.create({
      data: { lessonId, title: lesson.title, order: 0 },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.contentBlock.deleteMany({ where: { pageId: page!.id } });
    await tx.interactionBlock.deleteMany({ where: { pageId: page!.id } });

    for (let i = 0; i < generated.contentBlocks.length; i++) {
      const b = generated.contentBlocks[i];
      if (b.type !== "text" && b.type !== "heading") continue;
      await tx.contentBlock.create({
        data: { pageId: page!.id, type: b.type, content: b.content ?? {}, order: i },
      });
    }
    for (let i = 0; i < generated.interactionBlocks.length; i++) {
      const b = generated.interactionBlocks[i];
      if (!["reflection", "multiple_choice", "true_false"].includes(b.type)) continue;
      await tx.interactionBlock.create({
        data: { pageId: page!.id, type: b.type, config: (b.config ?? {}) as Prisma.InputJsonValue, order: i },
      });
    }
  });

  return { success: true, pageId: page.id };
}
