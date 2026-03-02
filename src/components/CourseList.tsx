"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/types";

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }
  if (courses.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        No courses yet. Create your first course to get started.
      </p>
    );
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  }

  return (
    <>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {courses.length} {courses.length === 1 ? "course" : "courses"}
      </p>
      <ul className="space-y-2">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.id}`}
              className="block rounded-md border border-gray-200 dark:border-gray-700 px-4 py-3 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="font-medium">{course.title}</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {course.topic} · {course.length}
              </span>
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                {course.status}
              </span>
              <span className="block mt-1 text-xs text-gray-400 dark:text-gray-500">
                Updated {formatDate(course.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
