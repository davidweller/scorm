import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();

  const downloadUrl = `/api/courses/${courseId}/export/scorm`;

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Export SCORM 1.2</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">
        Download a zip package containing imsmanifest.xml, index.html, and the SCORM API wrapper.
        Upload the zip to your LMS.
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6 max-w-xl">
        <a
          href={downloadUrl}
          download
          className="inline-block rounded-md bg-accent px-6 py-3 text-onPrimary font-medium hover:brightness-95"
        >
          Download SCORM 1.2 package
        </a>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          The package includes completion tracking support via the SCORM API. Test in your LMS (e.g. Moodle, Canvas) for full compatibility.
        </p>
      </div>
    </main>
  );
}
