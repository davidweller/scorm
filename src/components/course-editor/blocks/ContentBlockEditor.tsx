"use client";

import { useState } from "react";
import type { ContentBlockApiResponse } from "@/lib/api";
import { updateContentBlock } from "@/lib/api";

export function ContentBlockEditor({
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
  block: ContentBlockApiResponse;
  onRefresh: () => void;
  onDelete: () => void;
}) {
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

  if (block.type === "text") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <TextBlockEditor
          content={block.content as { text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "heading") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <HeadingBlockEditor
          content={block.content as { level?: number; text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "image") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <ImageBlockEditor
          content={block.content as { url?: string; alt?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "video_embed") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <VideoEmbedBlockEditor
          content={block.content as { url?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "key_insight") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <KeyInsightBlockEditor
          content={block.content as { text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  if (block.type === "key_point") {
    return (
      <BlockWrap block={block} onDelete={onDelete} saving={saving}>
        <KeyPointBlockEditor
          content={block.content as { title?: string; text?: string }}
          onSave={(c) => save(c)}
        />
      </BlockWrap>
    );
  }
  return (
    <BlockWrap block={block} onDelete={onDelete} saving={saving}>
      <p className="text-sm text-gray-400">Unknown block type: {block.type}</p>
    </BlockWrap>
  );
}

function BlockWrap({
  block,
  onDelete,
  saving,
  children,
}: {
  block: ContentBlockApiResponse;
  onDelete: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative rounded border border-gray-200 bg-white p-3">
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

function TextBlockEditor({
  content,
  onSave,
}: {
  content: { text?: string };
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(content.text ?? "");
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave({ text })}
      rows={3}
      className="w-full resize-y rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
  return (
    <div className="space-y-1">
      <select
        value={level}
        onChange={(e) => {
          const v = Number(e.target.value);
          setLevel(v);
          onSave({ level: v, text });
        }}
        className="rounded border border-gray-200 text-sm"
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
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm font-semibold focus:border-blue-500 focus:outline-none"
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
  return (
    <div className="space-y-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => onSave({ url, alt })}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="Image URL"
      />
      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() => onSave({ url, alt })}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
  return (
    <div>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => onSave({ url })}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave({ text })}
      rows={3}
      className="w-full resize-y rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => onSave({ title, text })}
        className="w-full rounded border border-gray-200 px-2 py-1 text-sm font-medium focus:border-blue-500 focus:outline-none"
        placeholder="Key point title (optional)"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave({ title, text })}
        rows={3}
        className="w-full resize-y rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="Key point content"
      />
    </div>
  );
}
