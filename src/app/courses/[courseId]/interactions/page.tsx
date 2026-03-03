import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/base-url";

async function getCourse(courseId: string) {
  const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function InteractionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) notFound();

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Interactions</h1>
      <p className="mt-2 text-gray-600">
        View and manage quizzes and interactions across the course.
      </p>
      <Link href={`/courses/${courseId}`} className="mt-4 inline-block text-blue-600 hover:underline">
        ← Back to course
      </Link>
    </main>
  );
}
