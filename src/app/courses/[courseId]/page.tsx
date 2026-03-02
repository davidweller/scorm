import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { CourseNav } from "@/components/CourseNav";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← Dashboard
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
          {course.topic} · {course.length} · {course.status}
        </p>
      </header>

      <CourseNav courseId={courseId} />

      <section className="mt-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground mb-2">Course hub</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Follow the workflow: Define branding → Generate blueprint → Approve → Generate modules →
          Add activities, YouTube, images → Preview → Export SCORM 1.2.
        </p>
      </section>
    </main>
  );
}
