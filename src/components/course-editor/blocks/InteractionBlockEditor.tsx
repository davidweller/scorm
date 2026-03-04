"use client";

import { useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { InteractionBlockApiResponse } from "@/lib/api";
import { updateInteractionBlock } from "@/lib/api";
import { BlockWrap } from "./BlockWrap";

export interface InteractionBlockEditorProps {
  courseId: string;
  moduleId: string;
  lessonId: string;
  pageId: string;
  block: InteractionBlockApiResponse;
  onRefresh: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export function InteractionBlockEditor({
  courseId,
  moduleId,
  lessonId,
  pageId,
  block,
  onRefresh,
  onDelete,
  onRegenerate,
  regenerating,
  dragAttributes,
  dragListeners,
  isDragging,
  style,
}: InteractionBlockEditorProps) {
  const [saving, setSaving] = useState(false);

  async function save(config: Record<string, unknown>) {
    setSaving(true);
    try {
      await updateInteractionBlock(courseId, moduleId, lessonId, pageId, block.id, { config });
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  const wrapProps = {
    blockId: block.id,
    blockType: block.type,
    variant: "interaction" as const,
    saving,
    regenerating,
    onDelete,
    onRegenerate,
    dragAttributes,
    dragListeners,
    isDragging,
    style,
  };

  if (block.type === "multiple_choice") {
    return (
      <BlockWrap {...wrapProps}>
        <MultipleChoiceEditor
          config={block.config as { question?: string; options?: string[]; correctIndex?: number; explanation?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "true_false") {
    return (
      <BlockWrap {...wrapProps}>
        <TrueFalseEditor
          config={block.config as { question?: string; correct?: boolean; explanation?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "reflection") {
    return (
      <BlockWrap {...wrapProps}>
        <ReflectionEditor
          config={block.config as { prompt?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "drag_and_drop") {
    return (
      <BlockWrap {...wrapProps}>
        <DragAndDropEditor
          config={block.config as { question?: string; items?: string[]; correctOrder?: number[]; explanation?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "matching") {
    return (
      <BlockWrap {...wrapProps}>
        <MatchingEditor
          config={block.config as { question?: string; pairs?: { left: string; right: string }[]; explanation?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "dialog_cards") {
    return (
      <BlockWrap {...wrapProps}>
        <DialogCardsEditor
          config={block.config as { title?: string; cards?: { front: string; back: string }[] }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  return (
    <BlockWrap {...wrapProps}>
      <p className="text-sm text-gray-400">Unknown type: {block.type}</p>
    </BlockWrap>
  );
}

function MultipleChoiceEditor({
  config,
  onSave,
}: {
  config: { question?: string; options?: string[]; correctIndex?: number; explanation?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [question, setQuestion] = useState(config.question ?? "");
  const [options, setOptions] = useState<string[]>(Array.isArray(config.options) && config.options.length > 0 ? config.options : ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(Math.max(0, config.correctIndex ?? 0));
  const [explanation, setExplanation] = useState(config.explanation ?? "");

  const save = () => {
    const opts = options.filter((o) => o.trim() !== "");
    if (opts.length === 0) return;
    onSave({
      question,
      options: opts,
      correctIndex: Math.min(correctIndex, opts.length - 1),
      explanation: explanation.trim() || undefined,
    });
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Question text…"
      />
      <label className="block text-xs font-medium text-gray-500">Options (select correct)</label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            name="correct"
            checked={correctIndex === i}
            onChange={() => {
              setCorrectIndex(i);
              onSave({ question, options, correctIndex: i, explanation });
            }}
            aria-label={`Option ${i + 1} is correct`}
          />
          <input
            type="text"
            value={opt}
            onChange={(e) => {
              const next = [...options];
              next[i] = e.target.value;
              setOptions(next);
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={`Option ${i + 1}`}
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => {
                const next = options.filter((_, j) => j !== i);
                setOptions(next);
                setCorrectIndex((prev) => (prev >= next.length ? next.length - 1 : prev));
                onSave({
                  question,
                  options: next,
                  correctIndex: correctIndex >= next.length ? next.length - 1 : correctIndex,
                  explanation,
                });
              }}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setOptions([...options, ""]);
        }}
        className="text-xs text-blue-600 hover:underline"
      >
        + Add option
      </button>
      <div>
        <label className="block text-xs font-medium text-gray-500">Explanation (optional)</label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Shown after answer"
        />
      </div>
    </div>
  );
}

function TrueFalseEditor({
  config,
  onSave,
}: {
  config: { question?: string; correct?: boolean; explanation?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [question, setQuestion] = useState(config.question ?? "");
  const [correct, setCorrect] = useState(config.correct ?? true);
  const [explanation, setExplanation] = useState(config.explanation ?? "");

  const save = () => onSave({ question, correct, explanation: explanation.trim() || undefined });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="True or false statement…"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            checked={correct === true}
            onChange={() => {
              setCorrect(true);
              onSave({ question, correct: true, explanation });
            }}
          />
          True
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            checked={correct === false}
            onChange={() => {
              setCorrect(false);
              onSave({ question, correct: false, explanation });
            }}
          />
          False
        </label>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Explanation (optional)</label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Shown after answer"
        />
      </div>
    </div>
  );
}

function ReflectionEditor({
  config,
  onSave,
}: {
  config: { prompt?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [prompt, setPrompt] = useState(config.prompt ?? "");

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">Reflection prompt (non-graded)</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={() => onSave({ prompt })}
        onKeyDown={handleKeyDown}
        rows={2}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="e.g. What did you find most useful?"
      />
    </div>
  );
}

function DragAndDropEditor({
  config,
  onSave,
}: {
  config: { question?: string; items?: string[]; correctOrder?: number[]; explanation?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [question, setQuestion] = useState(config.question ?? "");
  const [items, setItems] = useState<string[]>(
    Array.isArray(config.items) && config.items.length > 0 ? config.items : ["", ""]
  );
  const [explanation, setExplanation] = useState(config.explanation ?? "");

  const save = () => {
    const filteredItems = items.filter((item) => item.trim() !== "");
    if (filteredItems.length === 0) return;
    const correctOrder = filteredItems.map((_, i) => i);
    onSave({
      question,
      items: filteredItems,
      correctOrder,
      explanation: explanation.trim() || undefined,
    });
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="e.g. Put these steps in order…"
      />
      <label className="block text-xs font-medium text-gray-500">Items (in correct order)</label>
      <p className="text-xs text-gray-400">Enter items in the correct sequence. They will be shuffled for learners.</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-xs text-gray-400">{i + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              setItems(next);
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={`Item ${i + 1}`}
          />
          {items.length > 2 && (
            <button
              type="button"
              onClick={() => {
                const next = items.filter((_, j) => j !== i);
                setItems(next);
                const correctOrder = next.filter((x) => x.trim()).map((_, idx) => idx);
                onSave({ question, items: next.filter((x) => x.trim()), correctOrder, explanation });
              }}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, ""])}
        className="text-xs text-blue-600 hover:underline"
      >
        + Add item
      </button>
      <div>
        <label className="block text-xs font-medium text-gray-500">Explanation (optional)</label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Shown after answer"
        />
      </div>
    </div>
  );
}

function MatchingEditor({
  config,
  onSave,
}: {
  config: { question?: string; pairs?: { left: string; right: string }[]; explanation?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [question, setQuestion] = useState(config.question ?? "");
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>(
    Array.isArray(config.pairs) && config.pairs.length > 0
      ? config.pairs
      : [{ left: "", right: "" }, { left: "", right: "" }]
  );
  const [explanation, setExplanation] = useState(config.explanation ?? "");

  const save = () => {
    const filteredPairs = pairs.filter((p) => p.left.trim() !== "" || p.right.trim() !== "");
    if (filteredPairs.length === 0) return;
    onSave({
      question,
      pairs: filteredPairs,
      explanation: explanation.trim() || undefined,
    });
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="e.g. Match the terms to their definitions…"
      />
      <label className="block text-xs font-medium text-gray-500">Pairs (left matches right)</label>
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={pair.left}
            onChange={(e) => {
              const next = [...pairs];
              next[i] = { ...next[i], left: e.target.value };
              setPairs(next);
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Left item"
          />
          <span className="text-gray-400">↔</span>
          <input
            type="text"
            value={pair.right}
            onChange={(e) => {
              const next = [...pairs];
              next[i] = { ...next[i], right: e.target.value };
              setPairs(next);
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Right item"
          />
          {pairs.length > 2 && (
            <button
              type="button"
              onClick={() => {
                const next = pairs.filter((_, j) => j !== i);
                setPairs(next);
                onSave({ question, pairs: next.filter((p) => p.left.trim() || p.right.trim()), explanation });
              }}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setPairs([...pairs, { left: "", right: "" }])}
        className="text-xs text-blue-600 hover:underline"
      >
        + Add pair
      </button>
      <div>
        <label className="block text-xs font-medium text-gray-500">Explanation (optional)</label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Shown after answer"
        />
      </div>
    </div>
  );
}

function DialogCardsEditor({
  config,
  onSave,
}: {
  config: { title?: string; cards?: { front: string; back: string }[] };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(config.title ?? "");
  const [cards, setCards] = useState<{ front: string; back: string }[]>(
    Array.isArray(config.cards) && config.cards.length > 0
      ? config.cards
      : [{ front: "", back: "" }]
  );

  const save = () => {
    const filteredCards = cards.filter((c) => c.front.trim() !== "" || c.back.trim() !== "");
    if (filteredCards.length === 0) return;
    onSave({
      title: title.trim() || undefined,
      cards: filteredCards,
    });
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Title (optional)</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="e.g. Key Terms Review"
      />
      <label className="block text-xs font-medium text-gray-500">Cards (non-graded flip cards)</label>
      {cards.map((card, i) => (
        <div key={i} className="rounded border border-gray-200 bg-gray-50 p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Card {i + 1}</span>
            {cards.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = cards.filter((_, j) => j !== i);
                  setCards(next);
                  onSave({ title, cards: next.filter((c) => c.front.trim() || c.back.trim()) });
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <input
            type="text"
            value={card.front}
            onChange={(e) => {
              const next = [...cards];
              next[i] = { ...next[i], front: e.target.value };
              setCards(next);
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Front (question/term)"
          />
          <textarea
            value={card.back}
            onChange={(e) => {
              const next = [...cards];
              next[i] = { ...next[i], back: e.target.value };
              setCards(next);
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Back (answer/definition)"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setCards([...cards, { front: "", back: "" }])}
        className="text-xs text-blue-600 hover:underline"
      >
        + Add card
      </button>
    </div>
  );
}
