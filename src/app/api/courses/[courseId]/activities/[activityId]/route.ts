import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getActivityById, updateActivity, deleteActivity } from "@/lib/db/course-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; activityId: string }> }
) {
  const { courseId, activityId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const activity = await getActivityById(courseId, activityId);
  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  return NextResponse.json(activity);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; activityId: string }> }
) {
  const { courseId, activityId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const activity = await getActivityById(courseId, activityId);
  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.type !== undefined) updates.type = body.type;
    if (body.moduleId !== undefined) updates.moduleId = body.moduleId;
    if (body.h5pJson !== undefined && typeof body.h5pJson === "object") updates.h5pJson = body.h5pJson;
    if (body.order !== undefined) updates.order = Number(body.order);
    const updated = await updateActivity(courseId, activityId, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/courses/[courseId]/activities/[activityId]", e);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; activityId: string }> }
) {
  const { courseId, activityId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const ok = await deleteActivity(courseId, activityId);
  if (!ok) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
