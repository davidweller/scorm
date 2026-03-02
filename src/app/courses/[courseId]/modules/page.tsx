import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getBlueprint, getModules, getModulesApprovedAt } from "@/lib/db/course-data";
import { ModulesList } from "@/components/ModulesList";

export default async function ModulesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const [blueprint, modules, modulesApprovedAt] = await Promise.all([
    getBlueprint(courseId),
    getModules(courseId),
    getModulesApprovedAt(courseId),
  ]);
  const canSeed = !!blueprint?.lockedAt && modules.length === 0;
  const isCourseLocked = course.status === "ready_for_export";
  const modulesApproved = Boolean(modulesApprovedAt);

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Modules</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">
        Generate and edit module content; add YouTube links; lock modules when ready.
      </p>
      <ModulesList
        courseId={courseId}
        canSeed={canSeed}
        initialModules={modules}
        isCourseLocked={isCourseLocked}
        modulesApproved={modulesApproved}
      />
    </main>
  );
}
