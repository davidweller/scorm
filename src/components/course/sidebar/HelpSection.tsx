"use client";

import Link from "next/link";
import { BookOpenIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export function HelpSection() {
  return (
    <div className="space-y-0.5">
      <Link
        href="/docs"
        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <BookOpenIcon className="h-4 w-4" />
        Documentation
      </Link>
      <Link
        href="/support"
        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        Contact support
      </Link>
    </div>
  );
}
