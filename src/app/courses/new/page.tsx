"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, topic, length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create course");
        return;
      }
      router.push(`/courses/${data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← Dashboard
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Create new course</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Step 1: Create course. Next you will define branding, then generate the blueprint.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Course title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-foreground"
            placeholder="e.g. Introduction to Project Management"
          />
        </div>
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-1">
            Course topic (required)
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-foreground"
            placeholder="e.g. Project management fundamentals"
          />
        </div>
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-foreground mb-1">
            Total course length (required)
          </label>
          <input
            id="length"
            type="text"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-foreground"
            placeholder="e.g. 2 hours, 4 modules"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create course"}
          </button>
          <Link
            href="/"
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
