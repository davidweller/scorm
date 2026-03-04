"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface LessonItem {
  id: string;
  title: string;
  moduleTitle: string;
}

/** Lesson has "generated" content if it has at least one page with at least one content block */
function getInitialResultsFromCourse(
  modules: { lessons: { id: string; pages?: { contentBlocks?: unknown[] }[] }[] }[]
): Record<string, { success: boolean; error?: string }> {
  const initial: Record<string, { success: boolean; error?: string }> = {};
  for (const mod of modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      const hasContent = (lesson.pages ?? []).some(
        (p) => (p.contentBlocks ?? []).length > 0
      );
      if (hasContent) initial[lesson.id] = { success: true };
    }
  }
  return initial;
}

export default function GeneratePagesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<{
    id: string;
    title: string;
    modules: {
      title: string;
      lessons: {
        id: string;
        title: string;
        pages?: { contentBlocks?: unknown[] }[];
      }[];
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const loadCourse = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Course not found");
        throw new Error("Failed to load course");
      }
      const data = await res.json();
      setCourse(data);
      setResults(getInitialResultsFromCourse(data.modules ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const lessons: LessonItem[] = course
    ? course.modules.flatMap((m) =>
        (m.lessons ?? []).map((l) => ({ id: l.id, title: l.title, moduleTitle: m.title }))
      )
    : [];

  async function generateOne(lessonId: string) {
    setGeneratingId(lessonId);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/generate-pages`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResults((prev) => ({ ...prev, [lessonId]: { success: false, error: data.error || res.statusText } }));
      } else {
        setResults((prev) => ({ ...prev, [lessonId]: { success: true } }));
      }
    } catch (e) {
      setResults((prev) => ({ ...prev, [lessonId]: { success: false, error: e instanceof Error ? e.message : "Failed" } }));
    } finally {
      setGeneratingId(null);
    }
  }

  async function generateAll() {
    setGeneratingAll(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/generate-pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Generate all failed");
      const next: Record<string, { success: boolean; error?: string }> = {};
      (data.results ?? []).forEach((r: { lessonId: string; success: boolean; error?: string }) => {
        next[r.lessonId] = { success: r.success, error: r.error };
      });
      setResults(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate all failed");
    } finally {
      setGeneratingAll(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }
  if (error && !course) {
    return (
      <main className="min-h-screen p-8">
        <Link href="/courses" className="text-blue-600 hover:underline">← Courses</Link>
        <p className="mt-4 text-red-600">{error}</p>
      </main>
    );
  }

  const allDone = lessons.length > 0 && lessons.every((les) => results[les.id]?.success);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div>
          <Link href={`/courses/${courseId}`} className="text-blue-600 hover:underline">← Course</Link>
          <h1 className="mt-2 text-2xl font-bold">Generate Lessons</h1>
          <p className="mt-1 text-sm text-gray-500">{course?.title}</p>
        </div>

        <p className="mt-4 text-gray-600">
          Generate the written content for each lesson. This creates introductions, main content,
          and summaries based on your course blueprint and learning outcomes.
        </p>

        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        {lessons.length === 0 ? (
          <p className="mt-6 text-gray-500">No lessons yet. Add a blueprint first.</p>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {allDone 
                  ? "All lessons have content. You can regenerate individual lessons if needed."
                  : "Generate text content for each lesson."}
              </p>
              <button
                type="button"
                onClick={generateAll}
                disabled={generatingAll || generatingId !== null}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {generatingAll ? "Generating…" : "Generate all"}
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {lessons.map((les) => (
                <li
                  key={les.id}
                  className="flex items-center justify-between rounded border border-gray-200 bg-gray-50/50 px-4 py-3"
                >
                  <div>
                    <span className="font-medium">{les.title}</span>
                    <span className="ml-2 text-xs text-gray-500">{les.moduleTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {results[les.id] && (
                      <span className={results[les.id].success ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                        {results[les.id].success ? "Done" : results[les.id].error ?? "Failed"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => generateOne(les.id)}
                      disabled={generatingId !== null || generatingAll}
                      className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                      {generatingId === les.id ? "…" : results[les.id]?.success ? "Regenerate" : "Generate"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-10 flex gap-2">
          <Link
            href={`/courses/${courseId}/generate-interactions`}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Generate Interactions →
          </Link>
          <Link
            href={`/courses/${courseId}/edit`}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Edit course
          </Link>
        </div>
      </div>
    </main>
  );
}
