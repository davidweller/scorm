import Link from "next/link";
import { notFound } from "next/navigation";

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function getCourse(courseId: string) {
  const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) notFound();

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/courses" className="text-blue-600 hover:underline">
          ← Courses
        </Link>
        <h1 className="text-2xl font-bold">{course.title}</h1>
      </div>
      {course.overview && (
        <p className="mb-6 text-gray-600">{course.overview}</p>
      )}
      <div className="mb-2 text-sm font-medium text-gray-700">MVP flow</div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/courses/${courseId}/blueprint`}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Blueprint
        </Link>
        <Link
          href={`/courses/${courseId}/generate`}
          className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Generate content
        </Link>
        <Link
          href={`/courses/${courseId}/review`}
          className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Review
        </Link>
        <Link
          href={`/courses/${courseId}/export`}
          className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Export SCORM
        </Link>
        <Link
          href={`/courses/${courseId}/edit`}
          className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Edit course
        </Link>
      </div>
      {course.modules?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Modules</h2>
          <ul className="mt-2 space-y-2">
            {course.modules.map((m: { id: string; title: string }) => (
              <li key={m.id} className="rounded border p-3">
                {m.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
