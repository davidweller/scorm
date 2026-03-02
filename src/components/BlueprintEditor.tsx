"use client";

import { useEffect, useState } from "react";
import type { Blueprint, IntendedLearningOutcome, BlueprintModule } from "@/types";

export function BlueprintEditor({
  courseId,
  initialBlueprint,
  courseTitle: _courseTitle,
}: {
  courseId: string;
  initialBlueprint: Blueprint | null;
  courseTitle: string;
}) {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(initialBlueprint);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBlueprint(initialBlueprint);
  }, [initialBlueprint]);

  async function handleGenerate() {
    setError("");
    setMessage("");
    setGenerating(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/blueprint/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate");
        return;
      }
      setBlueprint(data);
      setMessage("Blueprint generated. Review and edit if needed, then approve & lock.");
    } catch {
      setError("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!blueprint) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/blueprint`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blueprint),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setMessage("Blueprint saved.");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleLock() {
    if (!blueprint) return;
    setError("");
    setMessage("");
    setLocking(true);
    try {
      const locked = { ...blueprint, lockedAt: new Date().toISOString() };
      const res = await fetch(`/api/courses/${courseId}/blueprint`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locked),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to lock");
        return;
      }
      setBlueprint(locked);
      await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "blueprint_locked" }),
      });
      setMessage("Blueprint locked. You can now generate modules.");
    } catch {
      setError("Something went wrong");
    } finally {
      setLocking(false);
    }
  }

  const isLocked = !!blueprint?.lockedAt;

  function updateOverview(v: string) {
    setBlueprint((b) => (b ? { ...b, overview: v } : null));
  }
  function updateIlos(ilos: IntendedLearningOutcome[]) {
    setBlueprint((b) => (b ? { ...b, ilos } : null));
  }
  function updateModules(modules: BlueprintModule[]) {
    setBlueprint((b) => (b ? { ...b, modules } : null));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {!blueprint || (Array.isArray(blueprint.ilos) && blueprint.ilos.length === 0 && blueprint.modules.length === 0) ? (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate a course structure from your course topic and length. You can edit the result before locking.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate blueprint"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {!isLocked && (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {generating ? "Generating…" : "Regenerate"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={handleLock}
                  disabled={locking}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {locking ? "Locking…" : "Approve & lock blueprint"}
                </button>
              </>
            )}
            {isLocked && (
              <span className="rounded-md bg-amber-100 dark:bg-amber-900/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                Blueprint locked
              </span>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

          <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Course overview</label>
              <textarea
                value={blueprint.overview ?? ""}
                onChange={(e) => updateOverview(e.target.value)}
                disabled={isLocked}
                rows={3}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Intended Learning Outcomes (ILOs)</label>
              <ul className="space-y-2">
                {blueprint.ilos.map((ilo, i) => (
                  <li key={ilo.id} className="flex gap-2">
                    <input
                      type="text"
                      value={ilo.text}
                      onChange={(e) => {
                        const next = [...blueprint.ilos];
                        next[i] = { ...ilo, text: e.target.value };
                        updateIlos(next);
                      }}
                      disabled={isLocked}
                      className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-70"
                    />
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => updateIlos(blueprint.ilos.filter((_, j) => j !== i))}
                        className="text-red-600 dark:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
                {!isLocked && (
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        updateIlos([
                          ...blueprint.ilos,
                          { id: crypto.randomUUID(), text: "" },
                        ])
                      }
                      className="text-sm text-blue-600 dark:text-blue-400"
                    >
                      + Add ILO
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Modules</label>
              <ul className="space-y-3">
                {blueprint.modules.map((mod, i) => (
                  <li key={mod.id} className="flex flex-col gap-1 rounded border border-gray-200 dark:border-gray-700 p-3">
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const next = [...blueprint.modules];
                        next[i] = { ...mod, title: e.target.value };
                        updateModules(next);
                      }}
                      disabled={isLocked}
                      placeholder="Module title"
                      className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 font-medium disabled:opacity-70"
                    />
                    <input
                      type="text"
                      value={mod.summary ?? ""}
                      onChange={(e) => {
                        const next = [...blueprint.modules];
                        next[i] = { ...mod, summary: e.target.value || undefined };
                        updateModules(next);
                      }}
                      disabled={isLocked}
                      placeholder="Summary"
                      className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm disabled:opacity-70"
                    />
                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {mod.timeMinutes != null && <span>{mod.timeMinutes} min</span>}
                      {mod.activityTypes?.length ? (
                        <span>{mod.activityTypes.join(", ")}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
