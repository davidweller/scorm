import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getBranding, getModules, getActivities } from "@/lib/db/course-data";
import { buildScormPackage } from "@/lib/scorm/package";

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
  try {
    const buffer = await buildScormPackage(course, branding, modules, activities);
    const filename = `scorm-${course.title.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50)}.zip`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("SCORM export", e);
    return NextResponse.json(
      { error: "Failed to build SCORM package" },
      { status: 500 }
    );
  }
}
