"use client";

import { useEffect, useState } from "react";

export function SettingsKeysForm() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings/keys")
      .then((r) => r.json())
      .then((d) => setHasKey(d.hasOpenAI === true))
      .catch(() => setHasKey(false));
  }, []);

  async function handleSave() {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiKey: keyInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setHasKey(!!keyInput.trim());
      setKeyInput("");
      setMessage("OpenAI key saved. It is stored encrypted and never logged.");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setError("");
    setMessage("");
    setClearing(true);
    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiKey: "" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to clear");
        return;
      }
      setHasKey(false);
      setKeyInput("");
      setMessage("Key cleared.");
    } catch {
      setError("Something went wrong");
    } finally {
      setClearing(false);
    }
  }

  if (hasKey === null) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {hasKey ? "An OpenAI API key is stored (encrypted)." : "No OpenAI key stored. Add one to enable AI generation and images."}
      </p>
      <div>
        <label htmlFor="openai-key" className="block text-sm font-medium text-foreground mb-1">
          OpenAI API key
        </label>
        <input
          id="openai-key"
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={hasKey ? "Enter new key to replace" : "sk-..."}
          className="w-full max-w-md rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
          autoComplete="off"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !keyInput.trim()}
          className="rounded-md bg-primary px-4 py-2 text-onPrimary font-medium hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save key"}
        </button>
        {hasKey && (
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {clearing ? "Clearing…" : "Clear key"}
          </button>
        )}
      </div>
    </div>
  );
}
