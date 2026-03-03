"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ITEMS: { href: (id: string) => string; label: string; exact?: boolean }[] = [
  { href: (id) => `/courses/${id}`, label: "Overview", exact: true },
  { href: (id) => `/courses/${id}#modules`, label: "Modules" },
  { href: (id) => `/courses/${id}/branding`, label: "Branding" },
  { href: (id) => `/courses/${id}/interactions`, label: "Interactions" },
  { href: (id) => `/courses/${id}/settings`, label: "Settings" },
  { href: (id) => `/courses/${id}/export`, label: "Export" },
];

export function CourseSidebar({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const basePath = `/courses/${courseId}`;
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href.endsWith("#modules")) return pathname === basePath;
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed left-4 top-20 z-20 rounded border border-gray-200 bg-white px-3 py-2 text-sm shadow lg:hidden"
        aria-label="Toggle sidebar"
      >
        {open ? "Close" : "Menu"}
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-10 w-56 border-r border-gray-200 bg-white pt-16 shadow-sm transition-transform lg:static lg:z-0 lg:pt-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <nav className="flex flex-col gap-0.5 p-4" aria-label="Course sections">
          {ITEMS.map((item) => {
            const href = item.href(courseId);
            const active = isActive(href, item.exact);
            return (
              <Link
                key={item.label}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {open && (
        <button
          type="button"
          aria-label="Close overlay"
          className="fixed inset-0 z-[9] bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
