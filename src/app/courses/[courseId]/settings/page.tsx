import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/base-url";

async function getCourse(courseId: string) {
  const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) notFound();

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-2 text-gray-600">
        Course metadata, ILOs, and settings will be configurable here.
      </p>
      <Link href={`/courses/${courseId}`} className="mt-4 inline-block text-blue-600 hover:underline">
        ← Back to course
      </Link>
    </main>
  );
}
