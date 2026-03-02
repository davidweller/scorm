import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/db/store";
import { getBranding } from "@/lib/db/course-data";
import { BrandingForm } from "@/components/BrandingForm";

export default async function BrandingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  const branding = await getBranding(courseId);

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href={`/courses/${courseId}`} className="text-gray-600 dark:text-gray-400 hover:text-foreground text-sm">
          ← {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Define branding</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">
        Set colours and fonts. These apply to HTML templates, H5P overrides, and generated images.
      </p>
      <BrandingForm courseId={courseId} initialBranding={branding} />
    </main>
  );
}
