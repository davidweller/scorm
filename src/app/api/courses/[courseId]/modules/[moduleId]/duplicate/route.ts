import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { courseId, moduleId } = await params;
  try {
    const source = await prisma.module.findFirst({
      where: { id: moduleId, courseId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            pages: {
              orderBy: { order: "asc" },
              include: {
                contentBlocks: { orderBy: { order: "asc" } },
                interactionBlocks: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });
    if (!source) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const maxOrder = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const newOrder = (maxOrder?.order ?? -1) + 1;

    const newModule = await prisma.module.create({
      data: {
        courseId,
        title: `${source.title} (copy)`,
        order: newOrder,
      },
    });

    for (const lesson of source.lessons) {
      const newLesson = await prisma.lesson.create({
        data: {
          moduleId: newModule.id,
          title: lesson.title,
          order: lesson.order,
        },
      });
      for (const page of lesson.pages) {
        const newPage = await prisma.page.create({
          data: {
            lessonId: newLesson.id,
            title: page.title,
            order: page.order,
            completionRules: page.completionRules ?? undefined,
          },
        });
        for (const block of page.contentBlocks) {
          await prisma.contentBlock.create({
            data: {
              pageId: newPage.id,
              type: block.type,
              content: block.content as object,
              order: block.order,
            },
          });
        }
        for (const block of page.interactionBlocks) {
          await prisma.interactionBlock.create({
            data: {
              pageId: newPage.id,
              type: block.type,
              config: block.config as object,
              order: block.order,
            },
          });
        }
      }
    }

    const created = await prisma.module.findUnique({
      where: { id: newModule.id },
      include: {
        lessons: { orderBy: { order: "asc" }, include: { pages: { orderBy: { order: "asc" } } } },
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to duplicate module" }, { status: 500 });
  }
}
