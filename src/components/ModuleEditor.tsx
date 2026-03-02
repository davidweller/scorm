"use client";

import { useEffect, useState } from "react";
import type { Module, ModuleSection } from "@/types";

export function ModuleEditor({
  courseId,
  moduleId,
  initialModule,
  isCourseLocked,
}: {
  courseId: string;
  moduleId: string;
  initialModule: Module;
  isCourseLocked: boolean;
}) {
  const [module, setModule] = useState<Module>(initialModule);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSectionIndex, setRegeneratingSectionIndex] = useState<number | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [imagePreset, setImagePreset] = useState("professional");
  const [customImagePrompt, setCustomImagePrompt] = useState("");

  useEffect(() => {
    setModule(initialModule);
  }, [initialModule]);

  const isLocked = isCourseLocked || !!module.lockedAt;

  async function save() {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: module.title,
          sections: module.sections,
          youtubeUrls: module.youtubeUrls,
          heroImageUrl: module.heroImageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setMessage("Saved.");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function generateContent() {
    setError("");
    setGenerating(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate");
        return;
      }
      setModule(data);
      setMessage("Content generated. Edit and save if needed.");
    } catch {
      setError("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateSection(index: number) {
    setError("");
    setRegeneratingSectionIndex(index);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/generate/section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to regenerate section");
        return;
      }
      setModule(data);
      setMessage(`Section ${index + 1} regenerated. Save to keep.`);
    } catch {
      setError("Something went wrong");
    } finally {
      setRegeneratingSectionIndex(null);
    }
  }

  async function lockModule() {
    setError("");
    setLocking(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockedAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to lock");
        return;
      }
      setModule((m) => ({ ...m, lockedAt: new Date().toISOString() }));
      setMessage("Module locked.");
    } catch {
      setError("Something went wrong");
    } finally {
      setLocking(false);
    }
  }

  function updateSection(index: number, updates: Partial<ModuleSection>) {
    const next = [...module.sections];
    next[index] = { ...next[index], ...updates };
    setModule((m) => ({ ...m, sections: next }));
  }

  function addSection() {
    setModule((m) => ({
      ...m,
      sections: [
        ...m.sections,
        {
          id: crypto.randomUUID(),
          heading: "",
          content: "",
          knowledgeChecks: [],
        },
      ],
    }));
  }

  function removeSection(index: number) {
    setModule((m) => ({
      ...m,
      sections: m.sections.filter((_, i) => i !== index),
    }));
  }

  function addYoutubeUrl() {
    const url = newYoutubeUrl.trim();
    if (!url) return;
    setModule((m) => ({ ...m, youtubeUrls: [...m.youtubeUrls, url] }));
    setNewYoutubeUrl("");
  }

  function removeYoutubeUrl(index: number) {
    setModule((m) => ({
      ...m,
      youtubeUrls: m.youtubeUrls.filter((_, i) => i !== index),
    }));
  }

  async function generateHeroImage() {
    setError("");
    setGeneratingImage(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/images/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stylePreset: imagePreset,
            ...(customImagePrompt.trim() && { customPrompt: customImagePrompt.trim() }),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate image");
        return;
      }
      setModule((m) => ({ ...m, heroImageUrl: data.url }));
      setMessage("Hero image generated. Save to keep it.");
    } catch {
      setError("Something went wrong");
    } finally {
      setGeneratingImage(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-wrap gap-2">
        {!isLocked && (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={generateContent}
              disabled={generating}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate content"}
            </button>
            <button
              onClick={lockModule}
              disabled={locking}
              className="rounded-md bg-accent px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
            >
              {locking ? "Locking…" : "Lock module"}
            </button>
          </>
        )}
        {isLocked && (
          <span className="rounded-md bg-secondary/40 px-3 py-2 text-sm text-foreground">
            Module locked
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Hero image</h3>
        {module.heroImageUrl ? (
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={module.heroImageUrl}
              alt="Module hero"
              className="max-w-md rounded border border-gray-200 dark:border-gray-700"
            />
          </div>
        ) : null}
        {!isLocked && (
          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={imagePreset}
                onChange={(e) => setImagePreset(e.target.value)}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="illustration">Illustration</option>
                <option value="photo">Photo</option>
                <option value="minimal">Minimal</option>
              </select>
              <button
                type="button"
                onClick={generateHeroImage}
                disabled={generatingImage}
                className="rounded-md border border-purple-500 text-purple-600 dark:text-purple-400 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50"
              >
                {generatingImage ? "Generating…" : "Generate hero image"}
              </button>
            </div>
            <input
              type="text"
              value={customImagePrompt}
              onChange={(e) => setCustomImagePrompt(e.target.value)}
              placeholder="Or custom prompt (overrides style preset when set)"
              className="w-full max-w-md rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Module title</label>
        <input
          type="text"
          value={module.title}
          onChange={(e) => setModule((m) => ({ ...m, title: e.target.value }))}
          disabled={isLocked}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 disabled:opacity-70"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">YouTube videos</h3>
        <ul className="space-y-2 mb-2">
          {module.youtubeUrls.map((url, i) => (
            <li key={i} className="flex gap-2 items-center">
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm truncate flex-1 hover:underline">
                {url}
              </a>
              {!isLocked && (
                <button type="button" onClick={() => removeYoutubeUrl(i)} className="text-red-600 dark:text-red-400 text-sm">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {!isLocked && (
          <div className="flex gap-2">
            <input
              type="url"
              value={newYoutubeUrl}
              onChange={(e) => setNewYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <button type="button" onClick={addYoutubeUrl} className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              Add
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Sections</h3>
        <div className="space-y-6">
          {module.sections.map((section, i) => (
            <div key={section.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Section {i + 1}</span>
                {!isLocked && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => regenerateSection(i)}
                      disabled={regeneratingSectionIndex !== null}
                      className="text-primary text-sm hover:underline disabled:opacity-50"
                    >
                      {regeneratingSectionIndex === i ? "Regenerating…" : "Regenerate"}
                    </button>
                    <button type="button" onClick={() => removeSection(i)} className="text-red-600 dark:text-red-400 text-sm">
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={section.heading}
                onChange={(e) => updateSection(i, { heading: e.target.value })}
                disabled={isLocked}
                placeholder="Heading"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 font-medium disabled:opacity-70"
              />
              <textarea
                value={section.content}
                onChange={(e) => updateSection(i, { content: e.target.value })}
                disabled={isLocked}
                placeholder="Content"
                rows={4}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-70"
              />
              <input
                type="text"
                value={section.scenario ?? ""}
                onChange={(e) => updateSection(i, { scenario: e.target.value || undefined })}
                disabled={isLocked}
                placeholder="Scenario (optional)"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-70"
              />
              <input
                type="text"
                value={section.reflectionPrompt ?? ""}
                onChange={(e) => updateSection(i, { reflectionPrompt: e.target.value || undefined })}
                disabled={isLocked}
                placeholder="Reflection prompt"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-70"
              />
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Further reading (one per line)</label>
                <textarea
                  value={(section.resourceSuggestions ?? []).join("\n")}
                  onChange={(e) =>
                    updateSection(i, {
                      resourceSuggestions: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={isLocked}
                  placeholder="One per line (optional)"
                  rows={2}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-70"
                />
              </div>
            </div>
          ))}
          {!isLocked && (
            <button
              type="button"
              onClick={addSection}
              className="rounded-md border border-dashed border-gray-400 dark:border-gray-500 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              + Add section
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
