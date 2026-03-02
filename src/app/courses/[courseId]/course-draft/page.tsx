import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getCourseDraft, getModulesApprovedAt } from "@/lib/db/course-data";
import { CourseDraftEditor } from "@/components/CourseDraftEditor";

export default async function CourseDraftPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const [draft, modulesApprovedAt] = await Promise.all([
    getCourseDraft(courseId),
    getModulesApprovedAt(courseId),
  ]);

  const isCourseLocked = course.status === "ready_for_export";
  const canGenerate = Boolean(modulesApprovedAt) && !isCourseLocked;

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link
          href={`/courses/${courseId}`}
          className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm"
        >
          ← {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground mb-2">Course draft</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400 mb-4 text-sm">
        Generate a single W1-style course document for review and editing. Once approved, it will be
        broken down into module sections and inline activities.
      </p>
      {!modulesApprovedAt && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-300 max-w-2xl">
          Approve the module list first on the Modules page before generating the course draft.
        </p>
      )}
      {isCourseLocked && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-300 max-w-2xl">
          This course is approved and locked; the draft can no longer be edited or regenerated.
        </p>
      )}
      <CourseDraftEditor
        courseId={courseId}
        initialDraft={draft ?? ""}
        canGenerate={canGenerate}
        isCourseLocked={isCourseLocked}
      />
    </main>
  );
}

