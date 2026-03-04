import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_TYPES = ["multiple_choice", "true_false", "reflection", "drag_and_drop", "matching", "dialog_cards"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string; pageId: string }> }
) {
  const { pageId } = await params;
  try {
    const body = await request.json();
    const { type, config, order } = body as { type?: string; config?: unknown; order?: number };
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json({ error: "Invalid interaction block type" }, { status: 400 });
    }
    const count = await prisma.interactionBlock.count({ where: { pageId } });
    const block = await prisma.interactionBlock.create({
      data: {
        pageId,
        type,
        config: config ?? {},
        order: typeof order === "number" ? order : count,
      },
    });
    return NextResponse.json(block);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2003") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create interaction block" }, { status: 500 });
  }
}
