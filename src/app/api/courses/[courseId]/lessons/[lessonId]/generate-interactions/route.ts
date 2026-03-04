import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInteractionsForLesson } from "@/lib/generate-lesson-interactions";
import type { InteractionBlockType } from "@/types/course";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await params;
  
  let body: {
    types?: InteractionBlockType[];
    count?: number;
    includeExplanations?: boolean;
  } = {};
  
  try {
    body = await request.json();
  } catch {
    // Use defaults if no body
  }

  const types = body.types ?? ["reflection", "multiple_choice", "true_false", "drag_and_drop", "matching", "dialog_cards"];
  const count = body.count ?? 2;
  const includeExplanations = body.includeExplanations ?? true;

  try {
    const result = await generateInteractionsForLesson(courseId, lessonId, {
      types,
      count,
      includeExplanations,
    });

    if (!result.success) {
      const status =
        result.error === "Course not found" || result.error === "Lesson not found"
          ? 404
          : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, module: { courseId } },
      select: {
        id: true,
        title: true,
        pages: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            blocks: {
              where: { category: "interaction" },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      generatedCount: result.count,
      lesson,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
