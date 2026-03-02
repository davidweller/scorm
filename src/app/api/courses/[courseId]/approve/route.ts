import { NextResponse } from "next/server";
import { getCourseById, updateCourse } from "@/lib/db/store";
import { getModules, setModules } from "@/lib/db/course-data";

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
    return NextResponse.json(course);
  }

  try {
    const now = new Date().toISOString();

    // Lock modules (UI indicator + prevents per-module edits too).
    const modules = await getModules(courseId);
    if (modules.length > 0) {
      const lockedModules = modules.map((m) => ({ ...m, lockedAt: m.lockedAt ?? now }));
      await setModules(courseId, lockedModules);
    }

    const updated = await updateCourse(courseId, { status: "ready_for_export" });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("POST /api/courses/[courseId]/approve", e);
    return NextResponse.json(
      { error: "Failed to approve course" },
      { status: 500 }
    );
  }
}

