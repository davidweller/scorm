import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePagesForLesson } from "@/lib/generate-lesson-pages";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await params;
  try {
    const result = await generatePagesForLesson(courseId, lessonId);
    if (!result.success) {
      const status = result.error === "Course not found" || result.error === "Lesson not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    const page = await prisma.page.findUnique({
      where: { id: result.pageId },
      include: {
        contentBlocks: { orderBy: { order: "asc" } },
        interactionBlocks: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(page);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
