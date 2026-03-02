import Link from "next/link";

export function CourseNav({ courseId }: { courseId: string }) {
  const base = `/courses/${courseId}`;
  const links = [
    { href: `${base}/branding`, label: "Branding" },
    { href: `${base}/blueprint`, label: "Blueprint" },
    { href: `${base}/modules`, label: "Modules" },
    { href: `${base}/activities`, label: "Activities" },
    { href: `${base}/preview`, label: "Preview" },
    { href: `${base}/export`, label: "Export SCORM" },
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
