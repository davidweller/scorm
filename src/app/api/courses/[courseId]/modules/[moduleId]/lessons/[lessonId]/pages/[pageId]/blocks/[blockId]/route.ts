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
    const { type, data, order } = body as { type?: string; data?: unknown; order?: number };
    const updateData: Prisma.BlockUpdateInput = {};
    if (type !== undefined) updateData.type = typeof type === "string" ? type : undefined;
    if (data !== undefined) updateData.data = data as Prisma.InputJsonValue;
    if (typeof order === "number") updateData.order = order;

    const block = await prisma.block.update({
      where: { id: blockId },
      data: updateData,
    });
    return NextResponse.json(block);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update block" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string; pageId: string; blockId: string }> }
) {
  const { blockId } = await params;
  try {
    await prisma.block.delete({ where: { id: blockId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to delete block" }, { status: 500 });
  }
}
