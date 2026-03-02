import Link from "next/link";
import { CourseList } from "@/components/CourseList";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-foreground">SCORM Builder</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
          Turn minimal input (topic + length) into a fully structured,
          interactive, SCORM-ready course — branded and LMS-compatible — in minutes.
        </p>
      </header>

      <section className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/courses/new"
          className="block rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-6 py-4 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
        >
          Create new course
        </Link>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Your courses</h2>
          <CourseList />
        </div>

        <nav className="pt-4">
          <Link href="/settings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-foreground">
            Settings (API keys)
          </Link>
        </nav>
      </section>
    </main>
  );
}
