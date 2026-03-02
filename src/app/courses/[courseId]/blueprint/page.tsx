import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getBlueprint } from "@/lib/db/course-data";
import { BlueprintEditor } from "@/components/BlueprintEditor";

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const blueprint = await getBlueprint(courseId);

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Blueprint</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">
        Generate and approve course structure: overview, ILOs, modules. Lock the blueprint before generating module content.
      </p>
      <BlueprintEditor
        courseId={courseId}
        initialBlueprint={blueprint}
        courseTitle={course.title}
      />
    </main>
  );
}
