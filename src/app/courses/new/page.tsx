import Link from "next/link";

export default function NewCoursePage() {
  return (
    <main className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/" className="text-secondary hover:text-foreground text-sm">
          ← Dashboard
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Create new course</h1>
      <p className="mt-2 text-secondary">
        Step 1: Create course. Next you will define branding, then generate the blueprint.
      </p>
      <div className="mt-8 max-w-md rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-secondary">
          Course form and wizard will be implemented in Phase 1–2.
        </p>
      </div>
    </main>
  );
}
