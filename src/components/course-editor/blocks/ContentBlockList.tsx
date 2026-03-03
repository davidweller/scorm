"use client";

import { useState } from "react";
import type { ContentBlockApiResponse } from "@/lib/api";
import {
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
} from "@/lib/api";
import { ContentBlockEditor } from "./ContentBlockEditor";

export function ContentBlockList({
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
  blocks: ContentBlockApiResponse[];
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  async function addBlock(
    type: "text" | "heading" | "image" | "video_embed" | "key_insight" | "key_point"
  ) {
    setError(null);
    setAdding(true);
    try {
      const content =
        type === "text"
          ? { text: "" }
          : type === "heading"
            ? { level: 1, text: "" }
            : type === "image"
              ? { url: "", alt: "" }
              : type === "video_embed"
                ? { url: "" }
                : type === "key_insight"
                  ? { text: "" }
                  : type === "key_point"
                    ? { title: "", text: "" }
                    : { url: "" };
      await createContentBlock(courseId, moduleId, lessonId, pageId, {
        type,
        content,
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
        <ContentBlockEditor
          key={block.id}
          courseId={courseId}
          moduleId={moduleId}
          lessonId={lessonId}
          pageId={pageId}
          block={block}
          onRefresh={onRefresh}
          onDelete={async () => {
            await deleteContentBlock(courseId, moduleId, lessonId, pageId, block.id);
            onRefresh();
          }}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock("text")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Text
        </button>
        <button
          type="button"
          onClick={() => addBlock("heading")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Heading
        </button>
        <button
          type="button"
          onClick={() => addBlock("image")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Image
        </button>
        <button
          type="button"
          onClick={() => addBlock("video_embed")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Video
        </button>
        <button
          type="button"
          onClick={() => addBlock("key_insight")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Key insight
        </button>
        <button
          type="button"
          onClick={() => addBlock("key_point")}
          disabled={adding}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          + Key point
        </button>
      </div>
    </div>
  );
}
