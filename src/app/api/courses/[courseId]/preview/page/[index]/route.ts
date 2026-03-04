import { NextResponse } from "next/server";
import { getCourseForExport } from "@/lib/course-export";
import { getBaseUrl } from "@/lib/base-url";
import {
  renderPageHtml,
  type ScormRuntimeOptions,
  type GradingKey,
} from "@/lib/scorm/render-page-html";
import type { CourseForExport } from "@/lib/scorm/build-package";

function getGradingKey(block: {
  id: string;
  type: string;
  config: Record<string, unknown>;
}): GradingKey | null {
  if (block.type === "multiple_choice") {
    const correctIndex = Number((block.config as { correctIndex?: number }).correctIndex ?? 0);
    return { blockId: block.id, type: "multiple_choice", correctIndex };
  }
  if (block.type === "true_false") {
    const correct = (block.config as { correct?: boolean }).correct !== false;
    return { blockId: block.id, type: "true_false", correct };
  }
  if (block.type === "drag_and_drop") {
    const correctOrder = (block.config as { correctOrder?: number[] }).correctOrder ?? [];
    return { blockId: block.id, type: "drag_and_drop", correctOrder };
  }
  if (block.type === "matching") {
    const pairs = (block.config as { pairs?: { left: string; right: string }[] }).pairs ?? [];
    return { blockId: block.id, type: "matching", pairCount: pairs.length };
  }
  return null;
}

function flattenPages(course: CourseForExport): { page: CourseForExport["modules"][0]["lessons"][0]["pages"][0]; index: number; moduleIndex: number; moduleTitle: string; lessonIndex: number; lessonTitle: string }[] {
  const out: { page: CourseForExport["modules"][0]["lessons"][0]["pages"][0]; index: number; moduleIndex: number; moduleTitle: string; lessonIndex: number; lessonTitle: string }[] = [];
  let index = 0;
  for (const mod of course.modules ?? []) {
    const moduleIndex = course.modules!.indexOf(mod);
    for (const lesson of mod.lessons ?? []) {
      const lessonIndex = mod.lessons!.indexOf(lesson);
      for (const page of lesson.pages ?? []) {
        out.push({
          page,
          index: index++,
          moduleIndex,
          moduleTitle: mod.title,
          lessonIndex,
          lessonTitle: lesson.title,
        });
      }
    }
  }
  return out;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; index: string }> }
) {
  const { courseId, index: indexParam } = await params;
  const index = parseInt(indexParam, 10);
  if (Number.isNaN(index) || index < 0) {
    return new NextResponse("Invalid page index", { status: 400 });
  }

  const course = await getCourseForExport(courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const flat = flattenPages(course);
  if (index >= flat.length) {
    return new NextResponse("Page not found", { status: 404 });
  }

  const { page, moduleIndex, moduleTitle, lessonIndex, lessonTitle } = flat[index];
  const baseUrl = getBaseUrl();
  const prevHref = index > 0 ? `${baseUrl}/api/courses/${courseId}/preview/page/${index - 1}` : undefined;
  const nextHref = index < flat.length - 1 ? `${baseUrl}/api/courses/${courseId}/preview/page/${index + 1}` : undefined;
  const scormApiPath = `${baseUrl}/api/courses/${courseId}/preview/scorm-api`;

  const brandConfig = course.brandConfig ?? undefined;
  const logoPath =
    brandConfig && typeof brandConfig === "object" && typeof (brandConfig as { logoUrl?: string }).logoUrl === "string"
      ? (brandConfig as { logoUrl: string }).logoUrl
      : undefined;

  let totalScoreMax = 0;
  for (const { page: p } of flat) {
    for (const block of p.interactionBlocks ?? []) {
      if (
        block.type === "multiple_choice" ||
        block.type === "true_false" ||
        block.type === "drag_and_drop" ||
        block.type === "matching"
      ) {
        totalScoreMax += 1;
      }
    }
  }

  const gradingKeysByBlockId: Record<string, GradingKey> = {};
  for (const block of page.interactionBlocks ?? []) {
    const key = getGradingKey({ id: block.id, type: block.type, config: block.config ?? {} });
    if (key) gradingKeysByBlockId[block.id] = key;
  }

  const scormRuntime: ScormRuntimeOptions = {
    pageIndex: index,
    totalPages: flat.length,
    totalScoreMax: Math.max(1, totalScoreMax),
    gradingKeysByBlockId,
  };

  const html = renderPageHtml({
    pageTitle: page.title,
    contentBlocks: page.contentBlocks,
    interactionBlocks: page.interactionBlocks,
    courseTitle: course.title,
    prevHref,
    nextHref,
    scormApiPath,
    brandConfig,
    logoPath,
    scormRuntime,
    moduleIndex,
    moduleTitle,
    lessonIndex,
    lessonTitle,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
