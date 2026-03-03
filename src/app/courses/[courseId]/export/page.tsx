"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ExportPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [version, setVersion] = useState<"1.2" | "2004">("1.2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          completionRules: {},
          scoring: {},
          lmsSettings: {},
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "scorm-course.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-xl">
        <div>
          <Link href={`/courses/${courseId}`} className="text-blue-600 hover:underline">← Course</Link>
          <h1 className="mt-2 text-2xl font-bold">Export SCORM</h1>
          <p className="mt-1 text-sm text-gray-500">Choose options and download your package.</p>
        </div>

        {error && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">SCORM version</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as "1.2" | "2004")}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="1.2">SCORM 1.2</option>
              <option value="2004">SCORM 2004 (3rd ed) — coming soon</option>
            </select>
          </div>
          <p className="text-sm text-gray-500">
            Completion and scoring use default behaviour (complete/incomplete per SCO). LMS settings can be configured in your LMS when importing.
          </p>
        </div>

        <div className="mt-10 flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Preparing…" : "Download ZIP"}
          </button>
          <Link
            href={`/courses/${courseId}`}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back to course
          </Link>
        </div>
      </div>
    </main>
  );
}
