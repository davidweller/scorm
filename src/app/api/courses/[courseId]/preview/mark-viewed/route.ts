import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { lastPreviewedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to mark as viewed" }, { status: 500 });
  }
}
