"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Module } from "@/types";

export function ModulesList({
  courseId,
  canSeed,
  initialModules,
}: {
  courseId: string;
  canSeed: boolean;
  initialModules: Module[];
}) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [seeding, setSeeding] = useState(false);
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
              disabled={seeding}
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
    <ul className="space-y-2">
      {modules.map((mod) => (
        <li key={mod.id}>
          <Link
            href={`/courses/${courseId}/modules/${mod.id}`}
            className="block rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <span className="font-medium text-foreground">{mod.title}</span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {mod.sections.length} section(s)
              {mod.youtubeUrls.length > 0 && ` · ${mod.youtubeUrls.length} video(s)`}
            </span>
            {mod.lockedAt && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-secondary/40 text-foreground">
                Locked
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
