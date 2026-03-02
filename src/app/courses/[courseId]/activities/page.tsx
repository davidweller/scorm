import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getActivities } from "@/lib/db/course-data";
import { ActivitiesList } from "@/components/ActivitiesList";

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const activities = await getActivities(courseId);

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">H5P activities</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">
        Add multiple choice or flashcards. Generate content with AI (or mock), edit, and assign to a module.
      </p>
      <ActivitiesList courseId={courseId} initialActivities={activities} />
    </main>
  );
}
