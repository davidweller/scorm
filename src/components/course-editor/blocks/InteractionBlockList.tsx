"use client";

import { useState } from "react";
import type { InteractionBlockApiResponse } from "@/lib/api";
import {
  createInteractionBlock,
  deleteInteractionBlock,
} from "@/lib/api";
import { InteractionBlockEditor } from "./InteractionBlockEditor";

export function InteractionBlockList({
  courseId,
  moduleId,
  lessonId,
  pageId,
  blocks,
  onRefresh,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  pageId: string;
  blocks: InteractionBlockApiResponse[];
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  async function addBlock(type: "multiple_choice" | "true_false" | "reflection") {
    setError(null);
    setAdding(true);
    try {
      const config =
        type === "multiple_choice"
          ? { question: "", options: ["", ""], correctIndex: 0 }
          : type === "true_false"
            ? { question: "", correct: true }
            : { prompt: "" };
      await createInteractionBlock(courseId, moduleId, lessonId, pageId, {
        type,
        config,
        order: blocks.length,
      });
      onRefresh();
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add block");
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sorted.map((block) => (
        <InteractionBlockEditor
          key={block.id}
          courseId={courseId}
          moduleId={moduleId}
          lessonId={lessonId}
          pageId={pageId}
          block={block}
          onRefresh={onRefresh}
          onDelete={async () => {
            await deleteInteractionBlock(courseId, moduleId, lessonId, pageId, block.id);
            onRefresh();
          }}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock("multiple_choice")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Multiple choice
        </button>
        <button
          type="button"
          onClick={() => addBlock("true_false")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + True / False
        </button>
        <button
          type="button"
          onClick={() => addBlock("reflection")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Reflection
        </button>
      </div>
    </div>
  );
}
