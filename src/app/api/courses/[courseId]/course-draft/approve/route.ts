import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import {
  addActivity,
  getCourseDraft,
  getModules,
  setActivities,
  setModules,
} from "@/lib/db/course-data";
import { getOpenAIKey } from "@/lib/db/settings";
import { breakdownCourseDraftWithAI } from "@/lib/openai/course-draft";

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
    const [draft, modules, existingActivities] = await Promise.all([
      getCourseDraft(courseId),
      getModules(courseId),
      // get all activities once; we may clear or reuse
      (async () => {
        const { getActivities } = await import("@/lib/db/course-data");
        return getActivities(courseId);
      })(),
    ]);

    if (!draft || !draft.trim()) {
      return NextResponse.json(
        { error: "No course draft found. Generate and save a draft first." },
        { status: 400 }
      );
    }
    if (modules.length === 0) {
      return NextResponse.json(
        { error: "No modules found. Create modules from the blueprint first." },
        { status: 400 }
      );
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI key not configured" },
        { status: 500 }
      );
    }

    const { moduleDrafts } = await breakdownCourseDraftWithAI(apiKey, {
      topic: course.topic,
      draft,
      modules,
    });

    // Reset activities for this course before recreating placeholders.
    await setActivities(courseId, []);

    // Apply drafts to modules and create activity placeholders.
    const byId: Record<string, (typeof moduleDrafts)[number]> = {};
    for (const md of moduleDrafts) {
      byId[md.moduleId] = md;
    }

    const updatedModules = [];
    for (const mod of modules) {
      const match = byId[mod.id];
      if (!match) {
        updatedModules.push({ ...mod, sections: [], lockedAt: mod.lockedAt });
        continue;
      }
      const draftMod = match.draft;
      const sections = draftMod.sections.map((s) => ({ ...s, activityIds: s.activityIds ?? [] }));
      const clampedIndex = (i: number) =>
        Math.max(0, Math.min(i, Math.max(0, sections.length - 1)));

      for (const a of draftMod.activities) {
        const activity = await addActivity(courseId, {
          type: a.type,
          moduleId: mod.id,
        });
        const idx = clampedIndex(a.placeAfterSectionIndex);
        const current = sections[idx]?.activityIds ?? [];
        sections[idx] = {
          ...sections[idx],
          activityIds: [...current, activity.id],
        };
      }

      updatedModules.push({ ...mod, sections });
    }

    await setModules(courseId, updatedModules);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/courses/[courseId]/course-draft/approve", e);
    return NextResponse.json(
      { error: "Failed to apply course draft" },
      { status: 500 }
    );
  }
}

