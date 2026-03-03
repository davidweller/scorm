import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { moduleId } = await params;
  try {
    const body = await request.json();
    const { title, order } = body as { title?: string; order?: number };
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const count = await prisma.lesson.count({ where: { moduleId } });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: title.trim(),
        order: typeof order === "number" ? order : count,
      },
    });
    return NextResponse.json(lesson);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2003") {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
