"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CourseDraftEditor({
  courseId,
  initialDraft,
  canGenerate,
  isCourseLocked,
}: {
  courseId: string;
  initialDraft: string;
  canGenerate: boolean;
  isCourseLocked: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  async function generate() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/course-draft`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate draft");
        return;
      }
      setDraft(data.draft || "");
      setMessage("Draft generated. Review and edit as needed.");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/course-draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save draft");
        return;
      }
      setMessage("Draft saved.");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function apply() {
    setError("");
    setMessage("");
    setApplying(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/course-draft/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to apply draft");
        return;
      }
      setMessage("Draft approved and applied. Modules have been updated.");
      router.push(`/courses/${courseId}/modules`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setApplying(false);
    }
  }

  const disableEdits = isCourseLocked;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate || loading || disableEdits}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Generating…" : initialDraft ? "Regenerate draft" : "Generate draft"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={disableEdits || saving}
          className="rounded-md bg-primary px-4 py-2 text-onPrimary text-sm font-medium hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={disableEdits || applying || !draft.trim()}
          className="rounded-md bg-accent px-4 py-2 text-onPrimary text-sm font-medium hover:brightness-95 disabled:opacity-50"
        >
          {applying ? "Applying…" : "Approve draft and create sections"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={disableEdits}
        className="w-full min-h-[24rem] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
        placeholder="Full course draft will appear here. Use module headings and W1-style narrative as a single document."
      />
    </div>
  );
}

