import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getBlueprint, setBlueprint } from "@/lib/db/course-data";
import type { Blueprint, IntendedLearningOutcome, BlueprintModule } from "@/types";

/** Mock blueprint generation. Replace with OpenAI call when BYOK is wired. */
function generateMockBlueprint(topic: string, length: string): Blueprint {
  const id = () => crypto.randomUUID();
  const ilos: IntendedLearningOutcome[] = [
    { id: id(), text: `Understand key concepts in ${topic}` },
    { id: id(), text: `Apply principles to practical scenarios` },
    { id: id(), text: `Evaluate and reflect on learning` },
  ];
  const modules: BlueprintModule[] = [
    { id: id(), title: "Introduction", summary: "Overview and objectives", timeMinutes: 15, activityTypes: ["reflection"], iloIds: [ilos[0].id] },
    { id: id(), title: "Core concepts", summary: "Main content", timeMinutes: 30, activityTypes: ["knowledge check", "scenario"], iloIds: [ilos[0].id, ilos[1].id] },
    { id: id(), title: "Application", summary: "Practice and examples", timeMinutes: 25, activityTypes: ["knowledge check", "reflection"], iloIds: [ilos[1].id] },
    { id: id(), title: "Summary and next steps", summary: "Recap and resources", timeMinutes: 10, activityTypes: ["reflection"], iloIds: [ilos[2].id] },
  ];
  return {
    overview: `This course covers ${topic}. Total length: ${length}. You will work through ${modules.length} modules.`,
    ilos,
    modules,
    tone: "professional",
    level: "intermediate",
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  try {
    const existing = await getBlueprint(courseId);
    if (existing?.lockedAt) {
      return NextResponse.json(
        { error: "Blueprint is locked" },
        { status: 400 }
      );
    }
    const blueprint = generateMockBlueprint(course.topic, course.length);
    await setBlueprint(courseId, blueprint);
    return NextResponse.json(blueprint);
  } catch (e) {
    console.error("POST /api/courses/[courseId]/blueprint/generate", e);
    return NextResponse.json(
      { error: "Failed to generate blueprint" },
      { status: 500 }
    );
  }
}
