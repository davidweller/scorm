"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

export function DragHandle({ attributes, listeners }: DragHandleProps) {
  return (
    <button
      type="button"
      className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="3" cy="2" r="1.5" />
        <circle cx="9" cy="2" r="1.5" />
        <circle cx="3" cy="6" r="1.5" />
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="3" cy="10" r="1.5" />
        <circle cx="9" cy="10" r="1.5" />
      </svg>
      <span className="sr-only">Drag to reorder</span>
    </button>
  );
}
