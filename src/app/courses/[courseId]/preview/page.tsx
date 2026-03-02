"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_CLASS: Record<Viewport, string> = {
  desktop: "w-full max-w-6xl h-[80vh]",
  tablet: "w-full max-w-3xl h-[80vh] mx-auto",
  mobile: "w-full max-w-md h-[80vh] mx-auto",
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [course, setCourse] = useState<{ title: string } | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => setCourse(d))
      .catch(() => setCourse(null));
  }, [courseId]);

  const previewUrl = `/api/courses/${courseId}/preview/html`;

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}`)}
          className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm"
        >
          ← {course?.title ?? "Course"}
        </button>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Preview</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-4">
        Responsive HTML preview. Switch viewport to see desktop, tablet, or mobile layout.
      </p>
      <div className="flex gap-2 mb-4">
        {(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setViewport(v)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
              viewport === v
                ? "bg-primary text-onPrimary"
                : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className={`border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden ${VIEWPORT_CLASS[viewport]}`}>
        <iframe
          src={previewUrl}
          title="Course preview"
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </main>
  );
}
