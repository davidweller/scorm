import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getModuleById, updateModule, getBlueprint } from "@/lib/db/course-data";
import { getOpenAIKey } from "@/lib/db/settings";
import { generateSingleSectionWithAI } from "@/lib/openai/module";
import type { ModuleSection } from "@/types";

function generateMockSection(moduleTitle: string, index: number): ModuleSection {
  return {
    id: crypto.randomUUID(),
    heading: `Section ${index + 1}`,
    content: `This section covers key points for ${moduleTitle}. Add your detailed content here or regenerate with AI.`,
    scenario: index === 0 ? undefined : `Consider a scenario where you apply these concepts.`,
    reflectionPrompt: `What is one takeaway from this section?`,
    knowledgeChecks: ["Check 1", "Check 2"],
    resourceSuggestions: ["Further reading"],
    activityIds: [],
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { courseId, moduleId } = await params;
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
  const mod = await getModuleById(courseId, moduleId);
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  if (mod.lockedAt) {
    return NextResponse.json(
      { error: "Module is locked" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const sectionIndex = typeof body.sectionIndex === "number" ? Math.floor(body.sectionIndex) : 0;
    const sections = [...mod.sections];
    if (sectionIndex < 0 || sectionIndex >= sections.length) {
      return NextResponse.json(
        { error: "Invalid section index" },
        { status: 400 }
      );
    }
    const apiKey = await getOpenAIKey();
    let newSection: ModuleSection;
    if (apiKey) {
      try {
        const blueprint = await getBlueprint(courseId);
        newSection = await generateSingleSectionWithAI(apiKey, {
          courseTopic: course.topic,
          moduleTitle: mod.title,
          sectionIndex,
          existingHeadings: sections.map((s) => s.heading),
          courseOverview: blueprint?.overview,
        });
      } catch (aiError) {
        console.error("Section generate OpenAI error", aiError);
        newSection = generateMockSection(mod.title, sectionIndex);
      }
    } else {
      newSection = generateMockSection(mod.title, sectionIndex);
    }
    sections[sectionIndex] = {
      ...newSection,
      id: sections[sectionIndex].id,
      activityIds: sections[sectionIndex].activityIds ?? [],
    };
    const updated = await updateModule(courseId, moduleId, { sections });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("POST .../modules/[moduleId]/generate/section", e);
    return NextResponse.json(
      { error: "Failed to generate section" },
      { status: 500 }
    );
  }
}
