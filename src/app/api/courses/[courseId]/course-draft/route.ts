import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import {
  getBlueprint,
  getCourseDraft,
  getModules,
  getModulesApprovedAt,
  setCourseDraft,
} from "@/lib/db/course-data";
import { getOpenAIKey } from "@/lib/db/settings";
import { generateCourseDraftWithAI } from "@/lib/openai/course-draft";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const draft = await getCourseDraft(courseId);
  return NextResponse.json({ draft: draft ?? "" });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.status === "ready_for_export") {
    return NextResponse.json(
      { error: "Course is approved and locked" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const draft = typeof body.draft === "string" ? body.draft : "";
    await setCourseDraft(courseId, draft);
    return NextResponse.json({ draft });
  } catch (e) {
    console.error("PATCH /api/courses/[courseId]/course-draft", e);
    return NextResponse.json(
      { error: "Failed to save course draft" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.status === "ready_for_export") {
    return NextResponse.json(
      { error: "Course is approved and locked" },
      { status: 400 }
    );
  }
  try {
    const modulesApprovedAt = await getModulesApprovedAt(courseId);
    if (!modulesApprovedAt) {
      return NextResponse.json(
        { error: "Approve the module list before generating the course draft." },
        { status: 400 }
      );
    }
    const [blueprint, modules] = await Promise.all([
      getBlueprint(courseId),
      getModules(courseId),
    ]);
    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint is required to generate the course draft." },
        { status: 400 }
      );
    }
    if (modules.length === 0) {
      return NextResponse.json(
        { error: "No modules found. Create modules from the blueprint first." },
        { status: 400 }
      );
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI key not configured" },
        { status: 500 }
      );
    }

    const draft = await generateCourseDraftWithAI(apiKey, {
      topic: course.topic,
      length: course.length,
      blueprint,
      modules,
    });
    await setCourseDraft(courseId, draft);
    return NextResponse.json({ draft });
  } catch (e) {
    console.error("POST /api/courses/[courseId]/course-draft", e);
    return NextResponse.json(
      { error: "Failed to generate course draft" },
      { status: 500 }
    );
  }
}

