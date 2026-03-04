"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InteractionBlockApiResponse } from "@/lib/api";
import {
  createInteractionBlock,
  deleteInteractionBlock,
  reorderInteractionBlocks,
} from "@/lib/api";
import { InteractionBlockEditor } from "./InteractionBlockEditor";

interface SortableBlockProps {
  block: InteractionBlockApiResponse;
  courseId: string;
  moduleId: string;
  lessonId: string;
  pageId: string;
  onRefresh: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

function SortableInteractionBlock({
  block,
  courseId,
  moduleId,
  lessonId,
  pageId,
  onRefresh,
  onDelete,
  onRegenerate,
  regenerating,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef}>
      <InteractionBlockEditor
        courseId={courseId}
        moduleId={moduleId}
        lessonId={lessonId}
        pageId={pageId}
        block={block}
        onRefresh={onRefresh}
        onDelete={onDelete}
        onRegenerate={onRegenerate}
        regenerating={regenerating}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
        style={style}
      />
    </div>
  );
}

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
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  
  // Local state for optimistic reordering
  const [localBlocks, setLocalBlocks] = useState<InteractionBlockApiResponse[]>([]);
  
  // Sync local state when props change
  useEffect(() => {
    setLocalBlocks([...blocks].sort((a, b) => a.order - b.order));
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localBlocks.findIndex((b) => b.id === active.id);
    const newIndex = localBlocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update local state immediately
    const reordered = arrayMove(localBlocks, oldIndex, newIndex);
    setLocalBlocks(reordered);
    
    const orderUpdates = reordered.map((b, i) => ({ id: b.id, order: i }));

    try {
      await reorderInteractionBlocks(courseId, moduleId, lessonId, pageId, orderUpdates);
      // Refresh to sync with server (local state already shows correct order)
      onRefresh();
    } catch (e) {
      // Revert on error
      setLocalBlocks([...blocks].sort((a, b) => a.order - b.order));
      setError(e instanceof Error ? e.message : "Failed to reorder");
    }
  }

  async function handleRegenerate(blockId: string) {
    setRegeneratingId(blockId);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/pages/${pageId}/interaction-blocks/${blockId}/regenerate`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Regenerate failed");
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setRegeneratingId(null);
    }
  }

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pl-8">
            {localBlocks.map((block) => (
              <SortableInteractionBlock
                key={block.id}
                block={block}
                courseId={courseId}
                moduleId={moduleId}
                lessonId={lessonId}
                pageId={pageId}
                onRefresh={onRefresh}
                onDelete={async () => {
                  await deleteInteractionBlock(courseId, moduleId, lessonId, pageId, block.id);
                  onRefresh();
                }}
                onRegenerate={() => handleRegenerate(block.id)}
                regenerating={regeneratingId === block.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap gap-2 pl-8">
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
