"use client";

import { useEffect, useState } from "react";
import type { Module, ModuleSection } from "@/types";

export function ModuleEditor({
  courseId,
  moduleId,
  initialModule,
}: {
  courseId: string;
  moduleId: string;
  initialModule: Module;
}) {
  const [module, setModule] = useState<Module>(initialModule);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [imagePreset, setImagePreset] = useState("professional");

  useEffect(() => {
    setModule(initialModule);
  }, [initialModule]);

  const isLocked = !!module.lockedAt;

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
          body: JSON.stringify({ stylePreset: imagePreset }),
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
              className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
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
              className="rounded-md bg-amber-600 px-4 py-2 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {locking ? "Locking…" : "Lock module"}
            </button>
          </>
        )}
        {isLocked && (
          <span className="rounded-md bg-amber-100 dark:bg-amber-900/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
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
          <div className="flex gap-2 items-center mb-4">
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
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-sm truncate flex-1">
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
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Section {i + 1}</span>
                {!isLocked && (
                  <button type="button" onClick={() => removeSection(i)} className="text-red-600 dark:text-red-400 text-sm">
                    Remove
                  </button>
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
