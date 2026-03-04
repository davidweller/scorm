import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string; pageId: string }> }
) {
  const { pageId } = await params;
  try {
    const body = await request.json();
    const { orderUpdates } = body as {
      orderUpdates?: { id: string; order: number }[];
    };

    if (!Array.isArray(orderUpdates) || orderUpdates.length === 0) {
      return NextResponse.json({ error: "orderUpdates array is required" }, { status: 400 });
    }

    await prisma.$transaction(
      orderUpdates.map((update) =>
        prisma.contentBlock.update({
          where: { id: update.id, pageId },
          data: { order: update.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to reorder blocks" }, { status: 500 });
  }
}
