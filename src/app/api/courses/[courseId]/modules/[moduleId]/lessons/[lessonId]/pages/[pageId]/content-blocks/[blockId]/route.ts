import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string; pageId: string; blockId: string }> }
) {
  const { blockId } = await params;
  try {
    const body = await request.json();
    const { type, content, order } = body as { type?: string; content?: unknown; order?: number };
    const data: Prisma.ContentBlockUpdateInput = {};
    if (type !== undefined) data.type = typeof type === "string" ? type : undefined;
    if (content !== undefined) data.content = content as Prisma.InputJsonValue;
    if (typeof order === "number") data.order = order;

    const block = await prisma.contentBlock.update({
      where: { id: blockId },
      data,
    });
    return NextResponse.json(block);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Content block not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update content block" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string; pageId: string; blockId: string }> }
) {
  const { blockId } = await params;
  try {
    await prisma.contentBlock.delete({ where: { id: blockId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Content block not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to delete content block" }, { status: 500 });
  }
}
