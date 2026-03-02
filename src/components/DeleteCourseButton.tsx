"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (res.status === 204) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 dark:text-red-400 hover:underline"
      >
        Delete course
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-foreground">Delete &quot;{courseTitle}&quot;? This cannot be undone.</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
