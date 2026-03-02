import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getActivityById, getModules } from "@/lib/db/course-data";
import { ActivityEditor } from "@/components/ActivityEditor";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; activityId: string }>;
}) {
  const { courseId, activityId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const [activity, modules] = await Promise.all([
    getActivityById(courseId, activityId),
    getModules(courseId),
  ]);
  if (!activity) notFound();

  const moduleOptions = modules.map((m) => ({ id: m.id, title: m.title }));

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}/activities`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← Activities
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground mb-8 capitalize">
        Edit: {activity.type.replace("_", " ")}
      </h1>
      <ActivityEditor
        courseId={courseId}
        initialActivity={activity}
        modules={moduleOptions}
      />
    </main>
  );
}
