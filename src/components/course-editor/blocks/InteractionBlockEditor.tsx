"use client";

import { useState } from "react";
import type { InteractionBlockApiResponse } from "@/lib/api";
import { updateInteractionBlock } from "@/lib/api";

export function InteractionBlockEditor({
  courseId,
  moduleId,
  lessonId,
  pageId,
  block,
  onRefresh,
  onDelete,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  pageId: string;
  block: InteractionBlockApiResponse;
  onRefresh: () => void;
  onDelete: () => void;
}) {
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

  if (block.type === "multiple_choice") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <MultipleChoiceEditor
          config={block.config as { question?: string; options?: string[]; correctIndex?: number; explanation?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "true_false") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <TrueFalseEditor
          config={block.config as { question?: string; correct?: boolean; explanation?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "reflection") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <ReflectionEditor
          config={block.config as { prompt?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  return (
    <BlockWrap block={block} onDelete={onDelete} saving={saving}>
      <p className="text-sm text-gray-400">Unknown type: {block.type}</p>
    </BlockWrap>
  );
}

function BlockWrap({
  block,
  onDelete,
  saving,
  children,
}: {
  block: InteractionBlockApiResponse;
  onDelete: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative rounded border border-amber-100 bg-amber-50/50 p-3">
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
      {children}
    </div>
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

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onBlur={save}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onBlur={save}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">Reflection prompt (non-graded)</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={() => onSave({ prompt })}
        rows={2}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="e.g. What did you find most useful?"
      />
    </div>
  );
}
