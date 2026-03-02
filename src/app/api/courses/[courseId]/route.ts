import { NextResponse } from "next/server";
import { getCourseById, updateCourse, deleteCourse } from "@/lib/db/store";
import { deleteCourseData } from "@/lib/db/course-data";
import type { CourseStatus } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  return NextResponse.json(course);
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
    const body = await request.json();
    const updates: Partial<{ title: string; topic: string; length: string; status: CourseStatus }> = {};
    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.topic === "string") updates.topic = body.topic;
    if (typeof body.length === "string") updates.length = body.length;
    if (body.status && ["draft", "blueprint_locked", "generating", "ready_for_export"].includes(body.status)) {
      updates.status = body.status;
    }
    const updated = await updateCourse(courseId, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/courses/[courseId]", e);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  try {
    await deleteCourseData(courseId);
    await deleteCourse(courseId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/courses/[courseId]", e);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
