import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePagesForLesson } from "@/lib/generate-lesson-pages";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const { lessonIds } = body as { lessonIds?: string[] };

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const targetIds =
      Array.isArray(lessonIds) && lessonIds.length > 0
        ? lessonIds.filter((id) => allLessonIds.includes(id))
        : allLessonIds;

    const results: { lessonId: string; success: boolean; error?: string }[] = [];
    for (const lessonId of targetIds) {
      const result = await generatePagesForLesson(courseId, lessonId);
      results.push({
        lessonId,
        success: result.success,
        ...(result.success ? {} : { error: result.error }),
      });
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generate pages failed" }, { status: 500 });
  }
}
