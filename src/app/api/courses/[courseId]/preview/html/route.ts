import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getBranding, getModules, getActivities } from "@/lib/db/course-data";
import { renderCourseHtml } from "@/lib/scorm/render-html";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const [branding, modules, activities] = await Promise.all([
    getBranding(courseId),
    getModules(courseId),
    getActivities(courseId),
  ]);
  const html = renderCourseHtml(course, branding, modules, activities);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
