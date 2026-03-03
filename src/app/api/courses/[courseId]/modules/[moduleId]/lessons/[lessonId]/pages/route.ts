import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  const { lessonId } = await params;
  try {
    const body = await request.json();
    const { title, order } = body as { title?: string; order?: number };
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const count = await prisma.page.count({ where: { lessonId } });
    const page = await prisma.page.create({
      data: {
        lessonId,
        title: title.trim(),
        order: typeof order === "number" ? order : count,
      },
    });
    return NextResponse.json(page);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2003") {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
