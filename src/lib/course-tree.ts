import type { CourseApiResponse, ModuleApiResponse, LessonApiResponse, PageApiResponse } from "./api";

export function findPage(
  course: CourseApiResponse,
  pageId: string
): { page: PageApiResponse; lesson: LessonApiResponse; module: ModuleApiResponse } | null {
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const page = lesson.pages.find((p) => p.id === pageId);
      if (page) return { page, lesson, module: mod };
    }
  }
  return null;
}

export function collectAllPages(course: CourseApiResponse): PageApiResponse[] {
  const pages: PageApiResponse[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      pages.push(...lesson.pages);
    }
  }
  return pages.sort((a, b) => a.order - b.order);
}

const WORDS_PER_MINUTE = 200;

function wordCountFromContent(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  let n = 0;
  const rec = (obj: unknown) => {
    if (typeof obj === "string") {
      n += obj.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
      return;
    }
    if (Array.isArray(obj)) obj.forEach(rec);
    else if (obj && typeof obj === "object") Object.values(obj).forEach(rec);
  };
  rec(content);
  return n;
}

export function getCourseCounts(course: CourseApiResponse): {
  totalModules: number;
  totalPages: number;
  totalLessons: number;
  totalInteractions: number;
} {
  let totalPages = 0;
  let totalInteractions = 0;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      totalPages += lesson.pages.length;
      for (const page of lesson.pages) {
        totalInteractions += page.interactionBlocks?.length ?? 0;
      }
    }
  }
  const totalLessons = course.modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
  return {
    totalModules: course.modules?.length ?? 0,
    totalLessons,
    totalPages,
    totalInteractions,
  };
}

/** Estimated seat time in minutes from content word count (read-only). */
export function getEstimatedSeatTimeMinutes(course: CourseApiResponse): number | null {
  let totalWords = 0;
  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      for (const page of lesson.pages ?? []) {
        for (const block of page.contentBlocks ?? []) {
          totalWords += wordCountFromContent(block.content);
        }
      }
    }
  }
  if (totalWords === 0) return null;
  return Math.max(1, Math.round(totalWords / WORDS_PER_MINUTE));
}

/** Completion %: pages that have at least one content block / total pages (0-100). */
export function getCourseCompletion(course: CourseApiResponse): number {
  const pages = collectAllPages(course);
  if (pages.length === 0) return 0;
  const withContent = pages.filter((p) => (p.contentBlocks?.length ?? 0) > 0).length;
  return Math.round((withContent / pages.length) * 100);
}

export type CourseStatus = "draft" | "ready_to_export";

export function getCourseStatus(course: CourseApiResponse): CourseStatus {
  const { totalPages } = getCourseCounts(course);
  const completion = getCourseCompletion(course);
  if (totalPages === 0 || completion < 50) return "draft";
  return "ready_to_export";
}

export function getFlowCompletion(course: CourseApiResponse): {
  blueprint: boolean;
  generate: boolean;
  review: boolean;
  preview: boolean;
  export: boolean;
} {
  const { totalModules, totalLessons, totalPages } = getCourseCounts(course);
  const completion = getCourseCompletion(course);
  const hasStructure = totalModules > 0 && totalLessons > 0;
  const hasContent = totalPages > 0 && completion > 0;
  return {
    blueprint: hasStructure,
    generate: hasContent,
    review: hasContent,
    preview: hasContent,
    export: hasContent,
  };
}

export function getModuleStats(module: ModuleApiResponse): {
  lessonCount: number;
  pageCount: number;
  interactionCount: number;
  completionPercent: number;
} {
  const lessons = module.lessons ?? [];
  let pageCount = 0;
  let interactionCount = 0;
  let pagesWithContent = 0;
  for (const lesson of lessons) {
    const pages = lesson.pages ?? [];
    pageCount += pages.length;
    for (const page of pages) {
      interactionCount += page.interactionBlocks?.length ?? 0;
      if ((page.contentBlocks?.length ?? 0) > 0) pagesWithContent++;
    }
  }
  const completionPercent = pageCount === 0 ? 0 : Math.round((pagesWithContent / pageCount) * 100);
  return {
    lessonCount: lessons.length,
    pageCount,
    interactionCount,
    completionPercent,
  };
}
