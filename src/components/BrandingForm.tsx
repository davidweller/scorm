"use client";

import { useEffect, useState } from "react";
import type { Branding } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

const FONT_OPTIONS = [
  "Work Sans, sans-serif",
  "Ubuntu, sans-serif",
  "system-ui, sans-serif",
  "Georgia, serif",
  "Palatino, serif",
  "Helvetica, Arial, sans-serif",
  "Inter, system-ui, sans-serif",
];

export function BrandingForm({
  courseId,
  initialBranding,
}: {
  courseId: string;
  initialBranding: Branding;
}) {
  const [branding, setBranding] = useState<Branding>(initialBranding);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBranding(initialBranding);
  }, [initialBranding]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setSaved(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resetToDefaults() {
    setBranding({ ...DEFAULT_BRANDING });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Primary colour</label>
          <input
            type="color"
            value={branding.primaryColor}
            onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))}
            className="h-10 w-full rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={branding.primaryColor}
            onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))}
            className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Secondary colour</label>
          <input
            type="color"
            value={branding.secondaryColor}
            onChange={(e) => setBranding((b) => ({ ...b, secondaryColor: e.target.value }))}
            className="h-10 w-full rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={branding.secondaryColor}
            onChange={(e) => setBranding((b) => ({ ...b, secondaryColor: e.target.value }))}
            className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Accent colour</label>
          <input
            type="color"
            value={branding.accentColor}
            onChange={(e) => setBranding((b) => ({ ...b, accentColor: e.target.value }))}
            className="h-10 w-full rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={branding.accentColor}
            onChange={(e) => setBranding((b) => ({ ...b, accentColor: e.target.value }))}
            className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Background colour</label>
          <input
            type="color"
            value={branding.backgroundColor}
            onChange={(e) => setBranding((b) => ({ ...b, backgroundColor: e.target.value }))}
            className="h-10 w-full rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={branding.backgroundColor}
            onChange={(e) => setBranding((b) => ({ ...b, backgroundColor: e.target.value }))}
            className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Heading font</label>
        <select
          value={branding.headingFont}
          onChange={(e) => setBranding((b) => ({ ...b, headingFont: e.target.value }))}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Body font</label>
        <select
          value={branding.bodyFont}
          onChange={(e) => setBranding((b) => ({ ...b, bodyFont: e.target.value }))}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Branding saved.</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save branding"}
        </button>
        <button
          type="button"
          onClick={resetToDefaults}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Reset to defaults
        </button>
      </div>
    </form>
  );
}
