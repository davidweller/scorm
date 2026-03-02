"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Module } from "@/types";

export function ModulesList({
  courseId,
  canSeed,
  initialModules,
  isCourseLocked,
  modulesApproved,
}: {
  courseId: string;
  canSeed: boolean;
  initialModules: Module[];
  isCourseLocked: boolean;
  modulesApproved: boolean;
}) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  async function handleSeed() {
    setError("");
    setSeeding(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create modules");
        return;
      }
      setModules(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setSeeding(false);
    }
  }

  if (modules.length === 0) {
    return (
      <div className="space-y-4">
        {canSeed ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Create one module per blueprint item. Do this after locking the blueprint.
            </p>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              onClick={handleSeed}
              disabled={seeding || isCourseLocked}
              className="rounded-md bg-primary px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
            >
              {seeding ? "Creating…" : "Create modules from blueprint"}
            </button>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Lock the blueprint first, then return here to create modules.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {modulesApproved ? (
          <span className="text-xs px-2 py-1 rounded-full bg-secondary/40 text-foreground">
            Module list approved
          </span>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Edit module titles and order as needed, then approve the module list before generating
            the full course draft.
          </p>
        )}
        {!modulesApproved && (
          <button
            type="button"
            onClick={async () => {
              setError("");
              setApproving(true);
              try {
                const res = await fetch(`/api/courses/${courseId}/modules/approve`, {
                  method: "POST",
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setError(data.error || "Failed to approve modules");
                  return;
                }
              } catch {
                setError("Something went wrong");
              } finally {
                setApproving(false);
              }
            }}
            disabled={isCourseLocked || approving}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-onPrimary hover:brightness-95 disabled:opacity-50"
          >
            {approving ? "Approving…" : "Approve module list"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <ul className="space-y-2">
        {modules.map((mod, idx) => (
          <li
            key={mod.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                  {mod.order}.
                </span>
                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) => {
                    const next = [...modules];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setModules(next);
                  }}
                  disabled={isCourseLocked || modulesApproved}
                  className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {mod.sections.length} section(s)
                  {mod.youtubeUrls.length > 0 && ` · ${mod.youtubeUrls.length} video(s)`}
                </span>
                {mod.lockedAt && (
                  <span className="px-1.5 py-0.5 rounded bg-secondary/40 text-foreground">
                    Locked
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Link
                href={`/courses/${courseId}/modules/${mod.id}`}
                className="text-xs text-primary hover:underline"
              >
                Open
              </Link>
              {!modulesApproved && !isCourseLocked && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === 0) return;
                      const next = [...modules];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setModules(
                        next.map((m, i) => ({
                          ...m,
                          order: i + 1,
                        }))
                      );
                    }}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === modules.length - 1) return;
                      const next = [...modules];
                      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                      setModules(
                        next.map((m, i) => ({
                          ...m,
                          order: i + 1,
                        }))
                      );
                    }}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = modules.filter((m) => m.id !== mod.id);
                      setModules(
                        next.map((m, i) => ({
                          ...m,
                          order: i + 1,
                        }))
                      );
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!modulesApproved && !isCourseLocked && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              const id = crypto.randomUUID();
              const next = [
                ...modules,
                {
                  ...modules[modules.length - 1],
                  id,
                  title: "New module",
                  order: modules.length + 1,
                },
              ];
              setModules(next);
            }}
            className="text-sm text-primary hover:underline"
          >
            + Add module
          </button>
          <div>
            <button
              type="button"
              onClick={async () => {
                setError("");
                setSaving(true);
                try {
                  for (const mod of modules) {
                    await fetch(`/api/courses/${courseId}/modules/${mod.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: mod.title, order: mod.order }),
                    });
                  }
                } catch {
                  setError("Failed to save module list");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save module list"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
