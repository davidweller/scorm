"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Activity } from "@/types";

export function ActivitiesList({
  courseId,
  initialActivities,
}: {
  courseId: string;
  initialActivities: Activity[];
}) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<"multiple_choice" | "flashcards">("multiple_choice");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  async function handleAdd() {
    setError("");
    setAdding(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create activity");
        return;
      }
      setActivities((prev) => [...prev, data].sort((a, b) => a.order - b.order));
      setShowAdd(false);
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          Add activity
        </button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Activity type</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                checked={type === "multiple_choice"}
                onChange={() => setType("multiple_choice")}
              />
              Multiple choice
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                checked={type === "flashcards"}
                onChange={() => setType("flashcards")}
              />
              Flashcards
            </label>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError(""); }}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-sm">No activities yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a.id}>
              <Link
                href={`/courses/${courseId}/activities/${a.id}`}
                className="block rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <span className="font-medium text-foreground capitalize">
                  {a.type.replace("_", " ")}
                </span>
                {a.moduleId && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Module: {a.moduleId}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
