import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getModules, setModules, setModulesApprovedAt } from "@/lib/db/course-data";

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
    const modules = await getModules(courseId);
    if (modules.length === 0) {
      return NextResponse.json(
        { error: "No modules to approve. Create modules from the blueprint first." },
        { status: 400 }
      );
    }

    // Ensure modules are ordered by their current order field.
    const ordered = [...modules].sort((a, b) => a.order - b.order);
    await setModules(courseId, ordered);

    const now = new Date().toISOString();
    await setModulesApprovedAt(courseId, now);
    return NextResponse.json({ ok: true, approvedAt: now });
  } catch (e) {
    console.error("POST /api/courses/[courseId]/modules/approve", e);
    return NextResponse.json(
      { error: "Failed to approve modules" },
      { status: 500 }
    );
  }
}

