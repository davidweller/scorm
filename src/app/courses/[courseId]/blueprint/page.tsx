"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface BlueprintModule {
  title: string;
  lessons: { title: string }[];
}

export default function BlueprintPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<{
    id: string;
    title: string;
    overview: string | null;
    audience: string | null;
    duration: string | null;
    modules?: { id: string; title: string; order: number; lessons: { id: string; title: string; order: number }[] }[];
    ilos?: string[] | null;
    assessmentPlan?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [modules, setModules] = useState<BlueprintModule[]>([]);
  const [ilos, setIlos] = useState<string[]>([]);
  const [assessmentPlan, setAssessmentPlan] = useState("");
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setDescription(data.overview ?? "");
      setModules(
        (data.modules ?? []).map((m: { title: string; lessons: { title: string }[] }) => ({
          title: m.title,
          lessons: (m.lessons ?? []).map((l: { title: string }) => ({ title: l.title })),
        }))
      );
      setIlos(Array.isArray(data.ilos) ? data.ilos : []);
      setAssessmentPlan(typeof data.assessmentPlan === "string" ? data.assessmentPlan : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  async function handleRegenerate(section: string) {
    setRegenerating(section);
    setError(null);
    try {
      const currentBlueprint: Record<string, unknown> = {};
      if (section === "lessons") {
        currentBlueprint.modules = modules.map((m) => ({ title: m.title }));
      }
      const res = await fetch(`/api/courses/${courseId}/blueprint/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, currentBlueprint }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Regenerate failed");
      }
      const data = await res.json();
      if (data.description !== undefined) setDescription(data.description);
      if (data.modules !== undefined) setModules(data.modules.map((m: { title: string }) => ({ ...m, lessons: [] })));
      if (data.lessons !== undefined && Array.isArray(data.lessons)) {
        const byModule: { title: string; lessons: { title: string }[] }[] = modules.map((m) => ({ title: m.title, lessons: [] }));
        data.lessons.forEach((l: { moduleIndex: number; title: string }) => {
          if (byModule[l.moduleIndex]) byModule[l.moduleIndex].lessons.push({ title: l.title });
        });
        setModules(byModule);
      }
      if (data.ilos !== undefined) setIlos(data.ilos);
      if (data.assessmentPlan !== undefined) setAssessmentPlan(data.assessmentPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setRegenerating(null);
    }
  }

  async function handleApply() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/blueprint/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || undefined,
          modules: modules.filter((m) => m.title.trim()).map((m) => ({
            title: m.title.trim(),
            lessons: (m.lessons ?? []).filter((l) => l.title.trim()).map((l) => ({ title: l.title.trim() })),
          })),
          ilos: ilos.filter(Boolean),
          assessmentPlan: assessmentPlan.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      router.push(`/courses/${courseId}/generate`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addModule() {
    setModules((prev) => [...prev, { title: "", lessons: [] }]);
  }
  function removeModule(i: number) {
    setModules((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addLesson(moduleIndex: number) {
    setModules((prev) => {
      const next = [...prev];
      if (!next[moduleIndex]) return next;
      next[moduleIndex] = { ...next[moduleIndex], lessons: [...(next[moduleIndex].lessons || []), { title: "" }] };
      return next;
    });
  }
  function removeLesson(moduleIndex: number, lessonIndex: number) {
    setModules((prev) => {
      const next = [...prev];
      if (!next[moduleIndex]) return next;
      next[moduleIndex] = {
        ...next[moduleIndex],
        lessons: next[moduleIndex].lessons.filter((_, j) => j !== lessonIndex),
      };
      return next;
    });
  }
  function setModuleTitle(i: number, title: string) {
    setModules((prev) => {
      const next = [...prev];
      if (!next[i]) return next;
      next[i] = { ...next[i], title };
      return next;
    });
  }
  function setLessonTitle(moduleIndex: number, lessonIndex: number, title: string) {
    setModules((prev) => {
      const next = [...prev];
      if (!next[moduleIndex]) return next;
      const lessons = [...(next[moduleIndex].lessons || [])];
      if (!lessons[lessonIndex]) return next;
      lessons[lessonIndex] = { ...lessons[lessonIndex], title };
      next[moduleIndex] = { ...next[moduleIndex], lessons };
      return next;
    });
  }
  function addIlo() {
    setIlos((prev) => [...prev, ""]);
  }
  function removeIlo(i: number) {
    setIlos((prev) => prev.filter((_, j) => j !== i));
  }
  function setIlo(i: number, value: string) {
    setIlos((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
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

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/courses/${courseId}`} className="text-blue-600 hover:underline">← Course</Link>
            <h1 className="mt-2 text-2xl font-bold">Course blueprint</h1>
            <p className="mt-1 text-sm text-gray-500">{course?.title}</p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Course description</h2>
            <button
              type="button"
              onClick={() => handleRegenerate("description")}
              disabled={regenerating !== null}
              className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {regenerating === "description" ? "…" : "Regenerate"}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Brief course description"
          />
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Modules & lessons</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRegenerate("modules")}
                disabled={regenerating !== null}
                className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {regenerating === "modules" ? "…" : "Regenerate modules"}
              </button>
              <button
                type="button"
                onClick={() => handleRegenerate("lessons")}
                disabled={regenerating !== null || modules.length === 0}
                className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {regenerating === "lessons" ? "…" : "Regenerate lessons"}
              </button>
              <button
                type="button"
                onClick={addModule}
                className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
              >
                + Module
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-4">
            {modules.map((mod, i) => (
              <div key={i} className="rounded border border-gray-200 bg-gray-50/50 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => setModuleTitle(i, e.target.value)}
                    placeholder={`Module ${i + 1} title`}
                    className="flex-1 rounded border border-gray-300 px-3 py-2"
                  />
                  <button type="button" onClick={() => removeModule(i)} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
                <ul className="mt-2 ml-4 space-y-1">
                  {(mod.lessons ?? []).map((les, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={les.title}
                        onChange={(e) => setLessonTitle(i, j, e.target.value)}
                        placeholder={`Lesson ${j + 1}`}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                      />
                      <button type="button" onClick={() => removeLesson(i, j)} className="text-red-600 hover:underline text-xs">
                        Remove
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={() => addLesson(i)} className="text-sm text-blue-600 hover:underline">
                      + Lesson
                    </button>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Learning outcomes (ILOs)</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRegenerate("ilos")}
                disabled={regenerating !== null}
                className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {regenerating === "ilos" ? "…" : "Regenerate"}
              </button>
              <button type="button" onClick={addIlo} className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300">
                + ILO
              </button>
            </div>
          </div>
          <ul className="mt-2 space-y-2">
            {ilos.map((ilo, i) => (
              <li key={i} className="flex gap-2">
                <input
                  type="text"
                  value={ilo}
                  onChange={(e) => setIlo(i, e.target.value)}
                  placeholder="By the end of this course…"
                  className="flex-1 rounded border border-gray-300 px-3 py-2"
                />
                <button type="button" onClick={() => removeIlo(i)} className="text-red-600 hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assessment plan</h2>
            <button
              type="button"
              onClick={() => handleRegenerate("assessmentPlan")}
              disabled={regenerating !== null}
              className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {regenerating === "assessmentPlan" ? "…" : "Regenerate"}
            </button>
          </div>
          <textarea
            value={assessmentPlan}
            onChange={(e) => setAssessmentPlan(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="How and where assessment will occur…"
          />
        </section>

        <div className="mt-10 flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & continue to generate content"}
          </button>
          <Link
            href={`/courses/${courseId}/edit`}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Skip to editor
          </Link>
        </div>
      </div>
    </main>
  );
}
