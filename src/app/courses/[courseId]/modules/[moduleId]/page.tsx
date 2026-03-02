import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getModuleById } from "@/lib/db/course-data";
import { ModuleEditor } from "@/components/ModuleEditor";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const moduleRecord = await getModuleById(courseId, moduleId);
  if (!moduleRecord) notFound();

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}/modules`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← Modules
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground mb-8">Edit module: {moduleRecord.title}</h1>
      <ModuleEditor
        courseId={courseId}
        moduleId={moduleId}
        initialModule={moduleRecord}
      />
    </main>
  );
}
