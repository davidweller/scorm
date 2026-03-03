"use client";

import { useRouter } from "next/navigation";
import type { CourseApiResponse } from "@/lib/api";
import { ModuleCard } from "./ModuleCard";

export function ModuleList({ courseId, course }: { courseId: string; course: CourseApiResponse }) {
  const router = useRouter();
  const modules = course.modules ?? [];

  const handleDeleted = () => {
    router.refresh();
  };

  return (
    <section id="modules" className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
      <ul className="space-y-4">
        {modules.map((mod) => (
          <li key={mod.id}>
            <ModuleCard courseId={courseId} module={mod} onDeleted={handleDeleted} />
          </li>
        ))}
      </ul>
    </section>
  );
}
