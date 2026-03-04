import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOpenAIClient, regenerateInteractionBlock } from "@/lib/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; pageId: string; blockId: string }> }
) {
  const { courseId, pageId, blockId } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        tone: true,
        settings: true,
      },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const block = await prisma.interactionBlock.findUnique({
      where: { id: blockId },
      include: {
        page: {
          include: {
            lesson: true,
            contentBlocks: {
              orderBy: { order: "asc" },
              select: { type: true, content: true },
            },
          },
        },
      },
    });

    if (!block || block.page.id !== pageId) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    const regenerableTypes = ["multiple_choice", "true_false", "reflection"];
    if (!regenerableTypes.includes(block.type)) {
      return NextResponse.json(
        { error: `Cannot regenerate interaction type: ${block.type}` },
        { status: 400 }
      );
    }

    const settings = course.settings as { apiKeys?: { openai?: string } } | null;
    const apiKey = settings?.apiKeys?.openai ?? null;
    const client = getOpenAIClient(apiKey);
    if (!client) {
      return NextResponse.json(
        { error: "No OpenAI API key configured" },
        { status: 400 }
      );
    }

    const pageContent = block.page.contentBlocks
      .map((b) => {
        const content = b.content as Record<string, unknown>;
        if (b.type === "text" && typeof content.text === "string") return content.text;
        if (b.type === "heading" && typeof content.text === "string") return `## ${content.text}`;
        if (b.type === "key_insight" && typeof content.text === "string") return content.text;
        if (b.type === "key_point" && typeof content.text === "string") return content.text;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");

    const result = await regenerateInteractionBlock(client, {
      blockType: block.type,
      currentConfig: block.config as Record<string, unknown>,
      pageContent,
      lessonTitle: block.page.lesson.title,
      courseTitle: course.title,
      tone: course.tone,
      includeExplanation: true,
    });

    const updated = await prisma.interactionBlock.update({
      where: { id: blockId },
      data: { config: result.config as Prisma.InputJsonValue },
    });

    return NextResponse.json({ success: true, block: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
