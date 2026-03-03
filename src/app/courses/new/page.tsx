"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_BRAND_CONFIG } from "@/types/branding";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [tone, setTone] = useState("");
  const [complianceLevel, setComplianceLevel] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_BRAND_CONFIG.primary ?? "");
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_BRAND_CONFIG.secondary ?? "");
  const [accentColor, setAccentColor] = useState(DEFAULT_BRAND_CONFIG.accent ?? "");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BRAND_CONFIG.background ?? "");
  const [font, setFont] = useState(DEFAULT_BRAND_CONFIG.bodyFont ?? DEFAULT_BRAND_CONFIG.font ?? "");
  const [headingFont, setHeadingFont] = useState(DEFAULT_BRAND_CONFIG.headingFont ?? "");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showBranding, setShowBranding] = useState(false);
  const [showByoKeys, setShowByoKeys] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const brandConfig = {
        ...DEFAULT_BRAND_CONFIG,
        ...(primaryColor && { primary: primaryColor, primaryButtonFill: primaryColor, linkColor: primaryColor, secondaryButtonColor: primaryColor }),
        ...(secondaryColor && { secondary: secondaryColor }),
        ...(accentColor && { accent: accentColor, ctaFill: accentColor }),
        ...(backgroundColor && { background: backgroundColor, secondaryButtonBg: backgroundColor }),
        ...(font.trim() && { font: font.trim(), bodyFont: font.trim() }),
        ...(headingFont.trim() && { headingFont: headingFont.trim() }),
      };
      const settings =
        openaiKey.trim() ? { apiKeys: { openai: openaiKey.trim() } } : undefined;

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Course",
          overview: overview.trim() || undefined,
          audience: audience.trim() || undefined,
          duration: duration.trim() || undefined,
          tone: tone.trim() || undefined,
          complianceLevel: complianceLevel.trim() || undefined,
          brandConfig,
          settings,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create course");
      }
      const course = await res.json();
      router.push(`/courses/${course.id}/blueprint`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Create course</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add title, audience, and options. You’ll define the blueprint next.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {error && (
            <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title / topic
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Data Privacy"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="overview" className="block text-sm font-medium text-gray-700">
                Overview (optional)
              </label>
              <textarea
                id="overview"
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={3}
                placeholder="Brief description of the course"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-gray-700">
                  Audience
                </label>
                <input
                  id="audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. corporate L&D, undergraduates"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <input
                  id="duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 4 weeks, 2 hours"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                  Tone
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Select (optional)</option>
                  <option value="formal">Formal</option>
                  <option value="conversational">Conversational</option>
                  <option value="technical">Technical</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
              <div>
                <label htmlFor="complianceLevel" className="block text-sm font-medium text-gray-700">
                  Compliance level
                </label>
                <select
                  id="complianceLevel"
                  value={complianceLevel}
                  onChange={(e) => setComplianceLevel(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Select (optional)</option>
                  <option value="standard">Standard</option>
                  <option value="strict">Strict</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowBranding(!showBranding)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showBranding ? "−" : "+"} Branding (optional)
            </button>
            {showBranding && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500">Primary (buttons, links)</label>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#015887"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Secondary (outline)</label>
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#015887"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Accent / CTA</label>
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#ff7700"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Background</label>
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#f8f8f8"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Heading font</label>
                  <input
                    type="text"
                    value={headingFont}
                    onChange={(e) => setHeadingFont(e.target.value)}
                    placeholder="Work Sans"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Body font</label>
                  <input
                    type="text"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    placeholder="Ubuntu"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowByoKeys(!showByoKeys)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showByoKeys ? "−" : "+"} Bring your own API keys (optional)
            </button>
            {showByoKeys && (
              <div className="mt-3">
                <label htmlFor="openaiKey" className="block text-xs text-gray-500">
                  OpenAI API key (for AI blueprint and content generation)
                </label>
                <input
                  id="openaiKey"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create and go to blueprint"}
            </button>
            <Link
              href="/courses"
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
