"use client";

import { useEffect, useState } from "react";
import type { Activity, H5PActivityType } from "@/types";

interface McAnswer {
  text: string;
  correct: boolean;
}

interface Flashcard {
  front: string;
  back: string;
}

export function ActivityEditor({
  courseId,
  initialActivity,
  modules,
}: {
  courseId: string;
  initialActivity: Activity;
  modules: { id: string; title: string }[];
}) {
  const [activity, setActivity] = useState<Activity>(initialActivity);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  const type = activity.type as H5PActivityType;
  const isMc = type === "multiple_choice";
  const json = activity.h5pJson as Record<string, unknown> | undefined;

  // Multiple choice state from h5pJson
  const mcQuestion = (json?.question as string) ?? "";
  const mcAnswers = (json?.answers as McAnswer[] | undefined) ?? [
    { text: "", correct: false },
    { text: "", correct: false },
  ];

  // Flashcards state from h5pJson
  const cards = (json?.cards as Flashcard[] | undefined) ?? [{ front: "", back: "" }];

  function buildMcJson(): Record<string, unknown> {
    return {
      question: mcQuestion,
      answers: mcAnswers.filter((a) => a.text.trim()),
    };
  }

  function buildFlashcardsJson(): Record<string, unknown> {
    return {
      cards: cards.filter((c) => c.front.trim() || c.back.trim()),
    };
  }

  async function save() {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const h5pJson = isMc ? buildMcJson() : buildFlashcardsJson();
      const res = await fetch(`/api/courses/${courseId}/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...activity, h5pJson }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setActivity(await res.json());
      setMessage("Saved.");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function generate() {
    setError("");
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/activities/${activity.id}/generate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate");
        return;
      }
      setActivity(data);
      setMessage("Content generated. Edit and save if needed.");
    } catch {
      setError("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate content"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Assign to module (optional)</label>
        <select
          value={activity.moduleId ?? ""}
          onChange={(e) =>
            setActivity((a) => ({ ...a, moduleId: e.target.value || undefined }))
          }
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          <option value="">— None —</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {isMc ? (
        <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-foreground">Multiple choice</h3>
          <div>
            <label className="block text-sm text-foreground mb-1">Question</label>
            <input
              type="text"
              value={mcQuestion}
              onChange={(e) => {
                const q = e.target.value;
                setActivity((a) => ({
                  ...a,
                  h5pJson: { ...a.h5pJson, question: q },
                }));
              }}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
              placeholder="Enter the question"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-1">Answers (check the correct one)</label>
            {mcAnswers.map((ans, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input
                  type="checkbox"
                  checked={ans.correct}
                  onChange={(e) => {
                    const next = mcAnswers.map((a, j) =>
                      j === i ? { ...a, correct: e.target.checked } : { ...a, correct: false }
                    );
                    setActivity((a) => ({ ...a, h5pJson: { ...a.h5pJson, answers: next } }));
                  }}
                />
                <input
                  type="text"
                  value={ans.text}
                  onChange={(e) => {
                    const next = [...mcAnswers];
                    next[i] = { ...next[i], text: e.target.value };
                    setActivity((a) => ({ ...a, h5pJson: { ...a.h5pJson, answers: next } }));
                  }}
                  className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                  placeholder={`Answer ${i + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...mcAnswers, { text: "", correct: false }];
                setActivity((a) => ({ ...a, h5pJson: { ...a.h5pJson, answers: next } }));
              }}
              className="text-sm text-primary hover:underline"
            >
              + Add answer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-foreground">Flashcards</h3>
          {cards.map((card, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={card.front}
                onChange={(e) => {
                  const next = [...cards];
                  next[i] = { ...next[i], front: e.target.value };
                  setActivity((a) => ({ ...a, h5pJson: { ...a.h5pJson, cards: next } }));
                }}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                placeholder="Front"
              />
              <input
                type="text"
                value={card.back}
                onChange={(e) => {
                  const next = [...cards];
                  next[i] = { ...next[i], back: e.target.value };
                  setActivity((a) => ({ ...a, h5pJson: { ...a.h5pJson, cards: next } }));
                }}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                placeholder="Back"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...cards, { front: "", back: "" }];
              setActivity((a) => ({ ...a, h5pJson: { ...a.h5pJson, cards: next } }));
            }}
            className="text-sm text-primary hover:underline"
          >
            + Add card
          </button>
        </div>
      )}
    </div>
  );
}
