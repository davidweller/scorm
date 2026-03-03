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
