import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string; pageId: string }> }
) {
  const { pageId } = await params;
  try {
    const body = await request.json();
    const { type, content, order } = body as { type?: string; content?: unknown; order?: number };
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    const validTypes = ["text", "heading", "image", "video_embed"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid content block type" }, { status: 400 });
    }
    const count = await prisma.contentBlock.count({ where: { pageId } });
    const block = await prisma.contentBlock.create({
      data: {
        pageId,
        type,
        content: content ?? {},
        order: typeof order === "number" ? order : count,
      },
    });
    return NextResponse.json(block);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2003") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create content block" }, { status: 500 });
  }
}
