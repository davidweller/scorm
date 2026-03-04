import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateInteractionsForLesson } from "@/lib/generate-lesson-interactions";
import type { InteractionConfig, InteractionBlockType } from "@/types/course";

function getDensityCount(density: InteractionConfig["density"]): number {
  switch (density) {
    case "light":
      return 1;
    case "heavy":
      return 3;
    case "moderate":
    default:
      return 2;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  let body: {
    config?: Partial<InteractionConfig>;
    lessonIds?: string[];
  } = {};

  try {
    body = await request.json();
  } catch {
    // Use defaults if no body
  }

  const config: InteractionConfig = {
    enabledTypes: body.config?.enabledTypes ?? ["reflection", "multiple_choice", "true_false", "drag_and_drop", "matching", "dialog_cards"],
    density: body.config?.density ?? "moderate",
    placement: body.config?.placement ?? {
      withinLessons: true,
      endOfModule: false,
      finalAssessment: false,
    },
    includeExplanations: body.config?.includeExplanations ?? true,
  };

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                pages: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    blocks: { select: { id: true, category: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Collect lessons to generate for
    let lessonsToProcess: { id: string; title: string; moduleTitle?: string }[] = [];

    if (body.lessonIds && body.lessonIds.length > 0) {
      // Generate for specific lessons only
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (body.lessonIds.includes(lesson.id)) {
            lessonsToProcess.push({ id: lesson.id, title: lesson.title });
          }
        }
      }
    } else if (config.placement.withinLessons) {
      // Generate for all lessons that have content but no interactions
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          const hasContent = lesson.pages.some((p) => p.blocks.some(b => b.category === "content"));
          const hasInteractions = lesson.pages.some((p) => p.blocks.some(b => b.category === "interaction"));
          if (hasContent && !hasInteractions) {
            lessonsToProcess.push({ id: lesson.id, title: lesson.title });
          }
        }
      }
    }

    const count = getDensityCount(config.density);
    const results: { lessonId: string; success: boolean; error?: string; count?: number }[] = [];

    for (const lesson of lessonsToProcess) {
      const result = await generateInteractionsForLesson(courseId, lesson.id, {
        types: config.enabledTypes as InteractionBlockType[],
        count,
        includeExplanations: config.includeExplanations,
      });

      if (result.success) {
        results.push({ lessonId: lesson.id, success: true, count: result.count });
      } else {
        results.push({ lessonId: lesson.id, success: false, error: result.error });
      }
    }

    // Save config to course for future use
    await prisma.course.update({
      where: { id: courseId },
      data: { interactionConfig: config as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      success: true,
      results,
      totalGenerated: results.filter((r) => r.success).reduce((sum, r) => sum + (r.count ?? 0), 0),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        interactionConfig: true,
        ilos: true,
        assessmentPlan: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const defaultConfig: InteractionConfig = {
      enabledTypes: ["reflection", "multiple_choice", "true_false", "drag_and_drop", "matching", "dialog_cards"],
      density: "moderate",
      placement: {
        withinLessons: true,
        endOfModule: false,
        finalAssessment: false,
      },
      includeExplanations: true,
    };

    return NextResponse.json({
      config: (course.interactionConfig as unknown as InteractionConfig) ?? defaultConfig,
      ilos: course.ilos,
      assessmentPlan: course.assessmentPlan,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}
