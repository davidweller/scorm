import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getActivities, addActivity } from "@/lib/db/course-data";
import type { H5PActivityType } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const activities = await getActivities(courseId);
  return NextResponse.json(activities);
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
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
    const type = body.type as H5PActivityType;
    if (type !== "multiple_choice" && type !== "flashcards") {
      return NextResponse.json(
        { error: "type must be multiple_choice or flashcards" },
        { status: 400 }
      );
    }
    const activity = await addActivity(courseId, {
      type,
      moduleId: body.moduleId ?? undefined,
    });
    return NextResponse.json(activity);
  } catch (e) {
    console.error("POST /api/courses/[courseId]/activities", e);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
