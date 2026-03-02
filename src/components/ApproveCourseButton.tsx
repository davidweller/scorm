"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveCourseButton({
  courseId,
  disabled,
}: {
  courseId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setError("");
    setApproving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to approve");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={approve}
        disabled={Boolean(disabled) || approving}
        className="rounded-md bg-accent px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
      >
        {approving ? "Approving…" : "Approve course (lock)"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

