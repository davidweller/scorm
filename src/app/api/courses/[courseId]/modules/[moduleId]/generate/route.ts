import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { addActivity, getActivities, getBlueprint, getModuleById, updateModule } from "@/lib/db/course-data";
import { getOpenAIKey } from "@/lib/db/settings";
import { generateModuleDraftWithAI } from "@/lib/openai/module";
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
  _request: Request,
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
    const apiKey = await getOpenAIKey();
    const allActivities = await getActivities(courseId);
    const moduleActivities = allActivities.filter((a) => a.moduleId === mod.id);
    const hasExistingActivities = moduleActivities.length > 0;
    const existingActivityIdsByIndex = mod.sections.map((s) => s.activityIds ?? []);

    let sections: ModuleSection[] = [];
    let draftActivities: { type: "multiple_choice" | "flashcards"; placeAfterSectionIndex: number }[] = [
      { type: "multiple_choice", placeAfterSectionIndex: 0 },
    ];

    if (apiKey) {
      try {
        const blueprint = await getBlueprint(courseId);
        const draft = await generateModuleDraftWithAI(apiKey, {
          courseTopic: course.topic,
          moduleTitle: mod.title,
          courseOverview: blueprint?.overview,
        });
        sections = draft.sections;
        draftActivities = draft.activities.map((a) => ({
          type: a.type,
          placeAfterSectionIndex: a.placeAfterSectionIndex,
        }));
      } catch (aiError) {
        console.error("Module content OpenAI error", aiError);
        sections = [
          {
            id: crypto.randomUUID(),
            heading: "Introduction",
            content: `Welcome to ${mod.title}. This module will guide you through the main concepts.`,
            reflectionPrompt: "What do you hope to learn from this module?",
            knowledgeChecks: [],
            activityIds: [],
          },
          generateMockSection(mod.title, 1),
          generateMockSection(mod.title, 2),
        ];
      }
    } else {
      sections = [
        {
          id: crypto.randomUUID(),
          heading: "Introduction",
          content: `Welcome to ${mod.title}. This module will guide you through the main concepts.`,
          reflectionPrompt: "What do you hope to learn from this module?",
          knowledgeChecks: [],
          activityIds: [],
        },
        generateMockSection(mod.title, 1),
        generateMockSection(mod.title, 2),
      ];
    }

    // Preserve existing inline placements if the module already has activities.
    if (hasExistingActivities) {
      sections = sections.map((s, i) => ({
        ...s,
        activityIds: existingActivityIdsByIndex[i] ?? [],
      }));
    } else {
      // Create new activity placeholders and place them inline.
      const clampedIndex = (i: number) => Math.max(0, Math.min(i, Math.max(0, sections.length - 1)));
      for (const a of draftActivities) {
        const activity = await addActivity(courseId, {
          type: a.type,
          moduleId: mod.id,
        });
        const idx = clampedIndex(a.placeAfterSectionIndex);
        const current = sections[idx]?.activityIds ?? [];
        sections[idx] = { ...sections[idx], activityIds: [...current, activity.id] };
      }
    }

    const updated = await updateModule(courseId, moduleId, { sections });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("POST .../modules/[moduleId]/generate", e);
    return NextResponse.json(
      { error: "Failed to generate module content" },
      { status: 500 }
    );
  }
}
