"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CourseItem = { id: string; title: string; overview: string | null; updatedAt: string };

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/courses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CourseItem[]) => {
        if (!cancelled) setCourses(data);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link
          href="/courses/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New course
        </Link>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading courses…</p>
      ) : !courses || courses.length === 0 ? (
        <p className="text-gray-600">No courses yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/courses/${c.id}`}
                className="block rounded border border-gray-200 p-4 hover:border-blue-300 hover:bg-gray-50"
              >
                <span className="font-medium">{c.title}</span>
                {c.overview && (
                  <p className="mt-1 text-sm text-gray-600">{c.overview}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Updated {new Date(c.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
