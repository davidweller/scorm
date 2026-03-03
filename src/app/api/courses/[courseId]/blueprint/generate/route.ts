import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getOpenAIClient,
  generateBlueprintSection,
  type BlueprintSection,
  type BlueprintData,
} from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { section, currentBlueprint } = body as {
      section: BlueprintSection;
      currentBlueprint?: BlueprintData;
    };
    if (!section || typeof section !== "string") {
      return NextResponse.json({ error: "section is required" }, { status: 400 });
    }

    const settings = course.settings as { apiKeys?: { openai?: string } } | null;
    const apiKey = settings?.apiKeys?.openai ?? null;
    const client = getOpenAIClient(apiKey);
    if (!client) {
      return NextResponse.json(
        { error: "No OpenAI API key. Add OPENAI_API_KEY in .env or use Bring your own key in course settings." },
        { status: 400 }
      );
    }

    const context = {
      title: course.title,
      overview: course.overview,
      audience: course.audience,
      duration: course.duration,
      tone: course.tone,
      complianceLevel: course.complianceLevel,
    };

    const result = await generateBlueprintSection(
      client,
      context,
      section,
      currentBlueprint
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Blueprint generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
