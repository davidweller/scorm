import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getBlueprint, getModules, setModules } from "@/lib/db/course-data";
import type { Module, ModuleSection } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const modules = await getModules(courseId);
  return NextResponse.json(modules);
}

/** Seed modules from locked blueprint (one Module per BlueprintModule). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const blueprint = await getBlueprint(courseId);
  if (!blueprint?.lockedAt) {
    return NextResponse.json(
      { error: "Blueprint must be locked before creating modules" },
      { status: 400 }
    );
  }
  const existing = await getModules(courseId);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Modules already exist for this course" },
      { status: 400 }
    );
  }
  const modules: Module[] = blueprint.modules.map((bm, i) => {
    const introSection: ModuleSection = {
      id: crypto.randomUUID(),
      heading: "Introduction",
      content: "",
      reflectionPrompt: "",
      knowledgeChecks: [],
    };
    return {
      id: bm.id,
      courseId,
      order: i + 1,
      title: bm.title,
      sections: [introSection],
      youtubeUrls: [],
    };
  });
  await setModules(courseId, modules);
  return NextResponse.json(modules);
}
