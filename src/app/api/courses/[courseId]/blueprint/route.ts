import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getBlueprint, setBlueprint } from "@/lib/db/course-data";
import type { Blueprint } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const blueprint = await getBlueprint(courseId);
  return NextResponse.json(blueprint ?? { ilos: [], modules: [] });
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
  try {
    const body = (await request.json()) as Blueprint;
    if (!Array.isArray(body.ilos) || !Array.isArray(body.modules)) {
      return NextResponse.json(
        { error: "ilos and modules must be arrays" },
        { status: 400 }
      );
    }
    const blueprint: Blueprint = {
      overview: body.overview,
      ilos: body.ilos,
      modules: body.modules,
      tone: body.tone,
      level: body.level,
      deliveryMode: body.deliveryMode,
      targetAudience: body.targetAudience,
      assessmentDescription: body.assessmentDescription,
      lockedAt: body.lockedAt,
    };
    await setBlueprint(courseId, blueprint);
    return NextResponse.json(blueprint);
  } catch (e) {
    console.error("PATCH /api/courses/[courseId]/blueprint", e);
    return NextResponse.json(
      { error: "Failed to update blueprint" },
      { status: 500 }
    );
  }
}
