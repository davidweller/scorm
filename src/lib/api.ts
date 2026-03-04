/**
 * Client-side API helpers for course CRUD. All paths are relative for same-origin.
 */

const base = "";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function fetchCourse(courseId: string) {
  return json<CourseApiResponse>(await fetch(`${base}/api/courses/${courseId}`));
}

export async function updateCourse(
  courseId: string,
  data: {
    title?: string;
    overview?: string;
    audience?: string;
    targetWordCount?: number | null;
    tone?: string;
    complianceLevel?: string;
    brandConfig?: unknown;
    settings?: unknown;
    ilos?: unknown;
    assessmentPlan?: unknown;
  }
) {
  return json<unknown>(await fetch(`${base}/api/courses/${courseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}

export async function createModule(courseId: string, data: { title: string; order?: number }) {
  return json<{ id: string }>(await fetch(`${base}/api/courses/${courseId}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}

export async function updateModule(courseId: string, moduleId: string, data: { title?: string; order?: number }) {
  return json<unknown>(await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}

export async function deleteModule(courseId: string, moduleId: string) {
  const res = await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
}

export async function createLesson(courseId: string, moduleId: string, data: { title: string; order?: number }) {
  return json<{ id: string }>(await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}/lessons`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}

export async function updateLesson(courseId: string, moduleId: string, lessonId: string, data: { title?: string; order?: number }) {
  return json<unknown>(await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}

export async function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
  const res = await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
}

export async function createPage(courseId: string, moduleId: string, lessonId: string, data: { title: string; order?: number }) {
  return json<{ id: string }>(await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/pages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}

export async function updatePage(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  data: { title?: string; order?: number; completionRules?: unknown }
) {
  return json<unknown>(
    await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function deletePage(courseId: string, moduleId: string, lessonId: string, pageId: string) {
  const res = await fetch(`${base}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/pages/${pageId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
}

function blockPath(courseId: string, moduleId: string, lessonId: string, pageId: string) {
  return `${base}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/pages/${pageId}`;
}

export async function createContentBlock(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  data: { type: string; content?: Record<string, unknown>; order?: number }
) {
  return json<{ id: string }>(
    await fetch(`${blockPath(courseId, moduleId, lessonId, pageId)}/content-blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function updateContentBlock(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  blockId: string,
  data: { type?: string; content?: Record<string, unknown>; order?: number }
) {
  return json<unknown>(
    await fetch(`${blockPath(courseId, moduleId, lessonId, pageId)}/content-blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function deleteContentBlock(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  blockId: string
) {
  const res = await fetch(`${blockPath(courseId, moduleId, lessonId, pageId)}/content-blocks/${blockId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
}

export async function createInteractionBlock(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  data: { type: string; config?: Record<string, unknown>; order?: number }
) {
  return json<{ id: string }>(
    await fetch(`${blockPath(courseId, moduleId, lessonId, pageId)}/interaction-blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function updateInteractionBlock(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  blockId: string,
  data: { type?: string; config?: Record<string, unknown>; order?: number }
) {
  return json<unknown>(
    await fetch(`${blockPath(courseId, moduleId, lessonId, pageId)}/interaction-blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function deleteInteractionBlock(
  courseId: string,
  moduleId: string,
  lessonId: string,
  pageId: string,
  blockId: string
) {
  const res = await fetch(`${blockPath(courseId, moduleId, lessonId, pageId)}/interaction-blocks/${blockId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
}

// Types matching API responses (course tree)
export interface CourseApiResponse {
  id: string;
  title: string;
  overview: string | null;
  audience: string | null;
  targetWordCount: number | null;
  tone: string | null;
  complianceLevel: string | null;
  brandConfig: unknown;
  settings: unknown;
  ilos: string[] | null;
  assessmentPlan: unknown;
  createdAt: string;
  updatedAt: string;
  modules: ModuleApiResponse[];
}

export interface ModuleApiResponse {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: LessonApiResponse[];
}

export interface LessonApiResponse {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  pages: PageApiResponse[];
}

export interface PageApiResponse {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  completionRules: unknown;
  contentBlocks: ContentBlockApiResponse[];
  interactionBlocks: InteractionBlockApiResponse[];
}

export interface ContentBlockApiResponse {
  id: string;
  pageId: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

export interface InteractionBlockApiResponse {
  id: string;
  pageId: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}
