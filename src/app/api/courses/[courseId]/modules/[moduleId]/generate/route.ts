import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getModuleById, updateModule } from "@/lib/db/course-data";
import type { ModuleSection } from "@/types";

/** Mock section content. Replace with OpenAI when BYOK is wired. */
function generateMockSection(moduleTitle: string, index: number): ModuleSection {
  return {
    id: crypto.randomUUID(),
    heading: `Section ${index + 1}`,
    content: `This section covers key points for ${moduleTitle}. Add your detailed content here or regenerate with AI.`,
    scenario: index === 0 ? undefined : `Consider a scenario where you apply these concepts.`,
    reflectionPrompt: `What is one takeaway from this section?`,
    knowledgeChecks: ["Check 1", "Check 2"],
    resourceSuggestions: ["Further reading"],
  };
}

export async function POST(
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
  if (mod.lockedAt) {
    return NextResponse.json(
      { error: "Module is locked" },
      { status: 400 }
    );
  }
  try {
    const newSections: ModuleSection[] = [
      {
        id: crypto.randomUUID(),
        heading: "Introduction",
        content: `Welcome to ${mod.title}. This module will guide you through the main concepts.`,
        reflectionPrompt: "What do you hope to learn from this module?",
        knowledgeChecks: [],
      },
      generateMockSection(mod.title, 1),
      generateMockSection(mod.title, 2),
    ];
    const updated = await updateModule(courseId, moduleId, { sections: newSections });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("POST .../modules/[moduleId]/generate", e);
    return NextResponse.json(
      { error: "Failed to generate module content" },
      { status: 500 }
    );
  }
}
