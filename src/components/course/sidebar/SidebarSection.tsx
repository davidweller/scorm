"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function SidebarSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="py-2">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
        >
          {title}
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
          />
        </button>
      ) : (
        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </div>
      )}
      {(!collapsible || isOpen) && <div className="mt-1">{children}</div>}
    </div>
  );
}
