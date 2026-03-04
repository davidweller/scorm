"use client";

import { useState, useRef, useEffect } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { ContentBlockApiResponse } from "@/lib/api";
import { updateContentBlock } from "@/lib/api";
import { BlockWrap } from "./BlockWrap";

export interface ContentBlockEditorProps {
  courseId: string;
  moduleId: string;
  lessonId: string;
  pageId: string;
  block: ContentBlockApiResponse;
  onRefresh: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export function ContentBlockEditor({
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
}: ContentBlockEditorProps) {
  const [saving, setSaving] = useState(false);

  async function save(content: Record<string, unknown>) {
    setSaving(true);
    try {
      await updateContentBlock(courseId, moduleId, lessonId, pageId, block.id, { content });
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  const wrapProps = {
    blockId: block.id,
    blockType: block.type,
    variant: "content" as const,
    saving,
    regenerating,
    onDelete,
    onRegenerate,
    dragAttributes,
    dragListeners,
    isDragging,
    style,
  };

  if (block.type === "text") {
    return (
      <BlockWrap {...wrapProps}>
        <TextBlockEditor
          content={block.content as { text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "heading") {
    return (
      <BlockWrap {...wrapProps}>
        <HeadingBlockEditor
          content={block.content as { level?: number; text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "image") {
    return (
      <BlockWrap {...wrapProps}>
        <ImageBlockEditor
          content={block.content as { url?: string; alt?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "video_embed") {
    return (
      <BlockWrap {...wrapProps}>
        <VideoEmbedBlockEditor
          content={block.content as { url?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "key_insight") {
    return (
      <BlockWrap {...wrapProps}>
        <KeyInsightBlockEditor
          content={block.content as { text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "key_point") {
    return (
      <BlockWrap {...wrapProps}>
        <KeyPointBlockEditor
          content={block.content as { title?: string; text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  return (
    <BlockWrap {...wrapProps}>
      <p className="text-sm text-gray-400">Unknown block type: {block.type}</p>
    </BlockWrap>
  );
}

function TextBlockEditor({
  content,
  onSave,
}: {
  content: { text?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(content.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave({ text })}
      onKeyDown={handleKeyDown}
      rows={1}
      className="w-full resize-none overflow-hidden rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="Enter text…"
    />
  );
}

function HeadingBlockEditor({
  content,
  onSave,
}: {
  content: { level?: number; text?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [level, setLevel] = useState(content.level ?? 1);
  const [text, setText] = useState(content.text ?? "");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-1">
      <select
        value={level}
        onChange={(e) => {
          const v = Number(e.target.value);
          setLevel(v);
          onSave({ level: v, text });
        }}
        className="rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
      </select>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave({ level, text })}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm font-semibold transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Heading text…"
      />
    </div>
  );
}

function ImageBlockEditor({
  content,
  onSave,
}: {
  content: { url?: string; alt?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [url, setUrl] = useState(content.url ?? "");
  const [alt, setAlt] = useState(content.alt ?? "");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => onSave({ url, alt })}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Image URL"
      />
      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() => onSave({ url, alt })}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Alt text"
      />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- user-provided URL, preview only
        <img src={url} alt={alt || "Preview"} className="max-h-40 rounded object-contain" />
      )}
    </div>
  );
}

function VideoEmbedBlockEditor({
  content,
  onSave,
}: {
  content: { url?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [url, setUrl] = useState(content.url ?? "");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => onSave({ url })}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="YouTube or Vimeo URL"
      />
      <p className="mt-1 text-xs text-gray-500">Paste a YouTube or Vimeo link; it will be embedded in the export.</p>
    </div>
  );
}

function KeyInsightBlockEditor({
  content,
  onSave,
}: {
  content: { text?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(content.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave({ text })}
      onKeyDown={handleKeyDown}
      rows={1}
      className="w-full resize-none overflow-hidden rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="Key insight or pull quote (e.g. a short, memorable statement)"
    />
  );
}

function KeyPointBlockEditor({
  content,
  onSave,
}: {
  content: { title?: string; text?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(content.title ?? "");
  const [text, setText] = useState(content.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => onSave({ title, text })}
        onKeyDown={handleInputKeyDown}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm font-medium transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Key point title (optional)"
      />
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave({ title, text })}
        onKeyDown={handleTextareaKeyDown}
        rows={1}
        className="w-full resize-none overflow-hidden rounded border border-gray-200 px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Key point content"
      />
    </div>
  );
}
