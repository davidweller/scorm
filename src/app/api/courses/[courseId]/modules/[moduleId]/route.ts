import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getModuleById, updateModule } from "@/lib/db/course-data";
import type { Module, ModuleSection } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { courseId, moduleId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const mod = await getModuleById(courseId, moduleId);
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  return NextResponse.json(mod);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { courseId, moduleId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const mod = await getModuleById(courseId, moduleId);
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const updates: Partial<Omit<Module, "id" | "courseId">> = {};
    if (body.title !== undefined) updates.title = String(body.title);
    if (body.order !== undefined) updates.order = Number(body.order);
    if (Array.isArray(body.sections)) {
      updates.sections = body.sections as ModuleSection[];
    }
    if (Array.isArray(body.youtubeUrls)) {
      updates.youtubeUrls = body.youtubeUrls.filter((u: unknown) => typeof u === "string");
    }
    if (body.heroImageUrl !== undefined) updates.heroImageUrl = body.heroImageUrl ? String(body.heroImageUrl) : undefined;
    if (body.lockedAt !== undefined) updates.lockedAt = body.lockedAt ? String(body.lockedAt) : undefined;
    const updated = await updateModule(courseId, moduleId, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/courses/[courseId]/modules/[moduleId]", e);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}
